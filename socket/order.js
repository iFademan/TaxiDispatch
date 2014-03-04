'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var OrderModel = mongoose.model('order');
var UserModel = mongoose.model('user');
var Status = require('./status');

var status = new Status();

var Order = function() {};

var OrderFunc = {
    // Поиск нового ордера
    findNewOrderById: function(user, callback) {
        var query = { user_id: user._id, new: 'true' };
        OrderModel.find(query, function(err, newOrders) {
            if (err) callback(err, null);
            callback(null, newOrders);
        });
    },

    // Все ордера пользователя, кроме новых (необработанных)
    findAllOrdersById: function(user, callback) {
        var query = { user_id: user._id, status: status.close };
        OrderModel.find(query, function(err, orders) {
            if (err) callback(err, null);
            callback(null, orders);
        });
    },

    // Берем первый новый ордер
    isNewOrder: function(orders, callback) {
        var newOrder = orders[0];
        if (newOrder[0] != null && newOrder[0] != '' && newOrder.length) {
            callback(newOrder[0]);
        }
    },

    // Смена статуса заказа
    changeStatus: function(args, sec, localStatus, callback) {
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
                if (err) throw err;
                callback(null, order);
                self.updateTableOrders(args.socket, function(orders) {});
            });
        }, sec * 1000);
    },

    // Назначение свободного водителя на заказ
    setFreeDriverOnOrder: function(args, sec, callback) {
        var freeDriver = { 'driver.order_id': null, driver: { $exists: true } };
        var updateOrderId = { 'driver.order_id': args.order._id };
        var driverUpdate = { $set: updateOrderId };

        var timer = setInterval(function() {
            UserModel.findOne(freeDriver, function(err, driver) {
                if (err) { callback(err) }
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
    },

    // освобождаем водителя от заказа
    setFreeDriver: function(order, callback) {
        var driverExists = { $exists: true };
        var findOrderId = { 'driver.order_id': order._id, driver: driverExists };
        var updateOrderId = { $set: { 'driver.order_id': null } };
        UserModel.update(findOrderId, updateOrderId, function(err, driver) {
            if (err) { throw err }
            callback(driver);
            log.info(('setFreeDriver:').yellow + ' водитель свободен!');
            console.log('водитель свободен!');
        });
    },

    // Отпавка сгенерированных таблиц с заказами
    sendTableOrders: function(orders) {
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
            //log.info(('sendTableOrders:').yellow  + ' html: ' + html.blue);
        } else {
            html += '<tbody><tr><td colspan="3" class="text-center">';
            html += ' - empty - ' + '</td></tr></tbody>';
            //log.info(('sendTableOrders:').yellow  + ' html: ' + html.blue);
        }
        return html;
    },

    updateTableOrders: function(socket, callback) {
        var self = this;
        var user = socket.handshake.user;
        var actions = [
            function(callback) { self.findNewOrderById(user, callback); },
            function(callback) { self.findAllOrdersById(user, callback); }
        ];
        async.series(actions, function(err, orders) {
            if (err) throw err;
            var newOrder = orders[0];
            var oldOrders = orders[1];

            socket.emit('orders:get', {
                newOrder: self.sendTableOrders(newOrder),
                oldOrders: self.sendTableOrders(oldOrders)
            }, function(callback) {
                log.info(('updateTableOrders:').yellow + ' ' + callback);
            });

            callback(orders);
        });
        log.info(('updateTableOrders:').yellow + ' actions: ' + actions);
    }
};

Order.prototype = OrderFunc;

module.exports = Order;
