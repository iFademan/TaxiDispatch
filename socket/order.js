'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var OrderModel = mongoose.model('order');
var UserModel = mongoose.model('user');
var Status = require('./status');

var status = new Status();

/**
 * Class orders
 * @constructor
 */
var Order = function() {
    /**
     * Search for a New Order
     * @type {Function}
     * @param {Object} user The current user
     * @param {Function} callback Error callback(err, null),
     * New order callback(null, newOrders)
     */
    this.findNewOrderById = function(user, callback) {
        var query = { user_id: user._id, new: 'true' };
        OrderModel.find(query, function(err, newOrders) {
            if (err) callback(err, null);
            callback(null, newOrders);
        });
    };

    /**
     * All orders user but new (unprocessed)
     * @type {Function}
     * @param {Object} user The current user
     * @param {Function} callback Error callback(err, null),
     * orders callback(null, orders)
     */
    this.findAllOrdersById = function(user, callback) {
        var query = { user_id: user._id, status: status.close };
        OrderModel.find(query, function(err, orders) {
            if (err) callback(err, null);
            callback(null, orders);
        });
    };

    /**
     * Checking for a new order
     * @type {Function}
     * @param {Object} orders A list of all orders
     * @param {Function} callback New order callback(newOrder[0])
     */
    this.isNewOrder = function(orders, callback) {
        var newOrder = orders[0];
        if (newOrder[0] != null && newOrder[0] != '' && newOrder.length) {
            callback(newOrder[0]);
        }
    };

    /**
     * Changing the status of your order
     * @type {Function}
     * @param {Object} args "args.socket" the object of socket.io,
     * "args.order" the object of new order
     * @param {Number} sec Time in seconds after which you change
     * the status of your order
     * @param {String} localStatus Identifier of status, all statuses
     * are described in config / config.json
     * @param {Function} callback Modified order callback(null, order),
     * error callback(err, null)
     * @this {Order}
     */
    this.changeStatus = function(args, sec, localStatus, callback) {
        var self = this;
        var changeOrder = '';

        var timer = setInterval(function() {
            if (localStatus == status.close) {
                changeOrder = { $set: { status: localStatus, new: 'false' } };
            } else {
                changeOrder = { $set: { status: localStatus } };
            }
            args.order.update(changeOrder, function(err, order) {
                clearInterval(timer);
                if (err) { callback(err, null) }
                callback(null, order);
                self.updateTableOrders(args.socket, function(orders) {});
            });
        }, sec * 1000);
    };

    /**
     * Assignment driver free to order
     * @type {Function}
     * @param {Object} args "args.socket" the object of socket.io,
     * "args.order" the object of new order
     * @param {Number} sec Time in seconds after which will re-search
     * free driver
     * @param {Function} callback Driver with a designated order
     * callback(null, driver), Error callback(err, null)
     */
    this.setFreeDriverOnOrder = function(args, sec, callback) {
        var freeDriver = { 'driver.order_id': null, driver: { $exists: true } };
        var updateOrderId = { 'driver.order_id': args.order._id };
        var driverUpdate = { $set: updateOrderId };

        var timer = setInterval(function() {
            UserModel.findOne(freeDriver, function(err, driver) {
                if (err) { callback(err, null) }
                if (driver != null && driver != '') {
                    var driverId = { _id: driver._id };
                    clearInterval(timer);
                    UserModel.update(driverId, driverUpdate, function(err, driver) {
                        if (err) { throw err }
                        callback(null, driver);
                    });
                }
            });
        }, sec * 1000);
    };

    /**
     * Relieve the driver of the order
     * @type {Function}
     * @param {Cursor} order Spent new order
     * @param {Function} callback Driver returns with purified field order,
     * driver.order_id: null, callback(driver) driver = cursor mongodb
     */
    this.setFreeDriver = function(order, callback) {
        var driverExists = { $exists: true };
        var findOrderId = {'driver.order_id': order._id, driver: driverExists };
        var updateOrderId = { $set: { 'driver.order_id': null } };
        UserModel.update(findOrderId, updateOrderId, function(err, driver) {
            if (err) { throw err }
            callback(driver);
            log.info(('setFreeDriver:').yellow + ' driver free!');
            console.log('driver free!');
        });
    };

    /**
     * Generate html-table with orders
     * @type {Function}
     * @param {Cursor} orders Cursor orders (orders)
     * @return {string} html Ready to insert a table on the client
     */
    this.genTableOrders = function(orders) {
        var html = '';
        if (orders != null && orders != '' && orders.length) {
            html += '<tbody>';
            orders.forEach(function(order) {
                html += '<tr>';
                html += '<td>' + order.start_address + '</td>';
                html += '<td>' + order.end_address + '</td>';
                html += '<td><span class="';
                html += config.get('status:' + order.status + ':style') + '">';
                html += config.get('status:' + order.status + ':text');
                html += '</span></td>';
                html += '</tr>';
            });
            html += '</tbody>';
            //log.info(('genTableOrders:').yellow  + ' html: ' + html.blue);
        } else {
            html += '<tbody><tr><td colspan="3" class="text-center">';
            html += ' - empty - ' + '</td></tr></tbody>';
            //log.info(('genTableOrders:').yellow  + ' html: ' + html.blue);
        }
        return html;
    };

    /**
     * Update tables of new and old orders
     * @param {Object} socket The object of socket.io
     * @param {Function} callback An array of new and old orders
     * @this {Order}
     */
    this.updateTableOrders = function(socket, callback) {
        var self = this;
        var user = socket.handshake.user;
        var actions = [
            function(callback) { self.findNewOrderById(user, callback); },
            function(callback) { self.findAllOrdersById(user, callback); }
        ];
        async.series(actions, function(err, orders) {
            if (err) { throw err }
            var newOrder = orders[0];
            var oldOrders = orders[1];

            socket.emit('orders:get', {
                newOrder: self.genTableOrders(newOrder),
                oldOrders: self.genTableOrders(oldOrders)
            }, function(callback) {
                log.info(('updateTableOrders:').yellow + ' ' + callback);
            });

            callback(orders);
        });
        log.info(('updateTableOrders:').yellow + ' actions: ' + actions);
    };
};

/**
 * Export Class Order
 * @type {Order}
 */
module.exports = Order;
