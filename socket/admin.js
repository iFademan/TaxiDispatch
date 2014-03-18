'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var UserModel = mongoose.model('user');
var OrderModel = mongoose.model('order');
var Order = require('./order');

var order = new Order();

/**
 * Class administrator, solves the problem of obtaining and updating data
 * for admins panel. All tables are updated every 10 seconds.
 * @constructor
 */
var Admin = function() {
    /**
     * Property stop / start timer
     * @private
     * @type {Boolean}
     */
    var _stopTimers = false;

    /**
     * Get the list of clients
     * @type {Function}
     * @param {Function} callback Clients callback(null, clients),
     * error callback(err, null)
     * @this {Admin}
     */
    this.listOfClients = function(callback) {
        var self = this;
        var findClients = { isAdmin: false, driver: { $exists: false } };
        var timer = setTimeout(function() {
            UserModel.find(findClients, function(err, clients) {
                if (err) callback(err, null);
                callback(null, clients);
            });
            self.listOfClients(callback);
        }, 10 * 1000);

        if (_stopTimers) {
            clearTimeout(timer);
        }
    };

    /**
     * Get the list of available drivers
     * @type {Function}
     * @param {Function} callback Drivers callback(null, drivers),
     * error callback(err, null)
     * @this {Admin}
     */
    this.listOfFreeDrivers = function(callback) {
        var self = this;
        var freeDriver = { 'driver.order_id': null, driver: { $exists: true } };
        var timer = setTimeout(function() {
            UserModel.find(freeDriver, function(err, drivers) {
                if (err) callback(err, null);
                if (drivers != null && drivers != '') {
                    callback(null, drivers);
                }
            });
            self.listOfFreeDrivers(callback);
        }, 10 * 1000);

        if (_stopTimers) {
            clearTimeout(timer);
        }
    };

    /**
     * Get all new orders
     * @type {Function}
     * @param {Function} callback New orders callback(null, newOrders),
     * error callback(err, null)
     * @this {Admin}
     */
    this.listAllNewOrders = function(callback) {
        var self = this;
        var timer = setTimeout(function() {
            OrderModel.find({ new: 'true' }, function(err, newOrders) {
                if (err) callback(err, null);
                callback(null, newOrders);
            });
            self.listAllNewOrders(callback);
        }, 10 * 1000);

        if (_stopTimers) {
            clearTimeout(timer);
        }
    };

    /**
     * Updates all tables in the administrator mode
     * @type {Function}
     * @param {Object} socket The object of socket.io
     * @param {Function} callback 3 returns the cursor to the object data
     * @this {Admin}
     */
    this.updateAdminTables = function(socket, callback) {
        var self = this;
        var actions = [
            function(callback) { self.listOfFreeDrivers(callback) },
            function(callback) { self.listAllNewOrders(callback) },
            function(callback) { self.listOfClients(callback) }
        ];
        async.series(actions, function(err, data) {
            if (err) { throw err }
            var listFreeDrivers = data[0];
            var listAllNewOrders = data[1];
            var listOfClients = data[2];

            socket.emit('admin:send', {
                listFreeDrivers: self.sendDriversTable(listFreeDrivers),
                listAllNewOrders: self.genTableOrders(listAllNewOrders),
                listOfClients: self.sendClientsTable(listOfClients)
            }, function(callback) {
                log.info(('updateAdminTables:').yellow + ' ' + callback);
            });

            callback(data);
        });
    };

    /**
     * Creates a html-table for free drivers
     * @type {Function}
     * @param {Cursor} drivers
     * @return {String} html
     */
    this.sendDriversTable = function(drivers) {
        var html = '';
        if (drivers != null && drivers != '' && drivers.length) {
            html += '<tbody>';
            drivers.forEach(function(driver) {
                html += '<tr>';
                html += '<td>' + driver.name + '</td>';
                html += '<td>' + driver.driver.driver_license_id + '</td>';
                html += '<td>' + driver.driver.experience + '</td>';
                html += '<td>' + driver.age + '</td>';
                html += '<td>' + driver.gender + '</td>';
                html += '</tr>';
            });
            html += '</tbody>';
        } else {
            html += '<tbody><tr><td colspan="3" class="text-center">';
            html += ' - empty - ' + '</td></tr></tbody>';
        }
        return html;
    };

    /**
     * Creates a html-table for all clients
     * @type {Function}
     * @param {Cursor} clients
     * @return {string} html
     */
    this.sendClientsTable = function(clients) {
        var html = '';
        if (clients != null && clients != '' && clients.length) {
            html += '<tbody>';
            clients.forEach(function(client) {
                html += '<tr>';
                html += '<td>' + client.name + '</td>';
                html += '<td>' + client.age + '</td>';
                html += '<td>' + client.gender + '</td>';
                html += '</tr>';
            });
            html += '</tbody>';
        } else {
            html += '<tbody><tr><td colspan="3" class="text-center">';
            html += ' - empty - ' + '</td></tr></tbody>';
        }
        return html;
    };

    /**
     * Determine the type of user
     * @type {Function}
     * @param {Object} user The current user
     * @param {Function} callback Driver callback(true, false),
     * client callback(false, false), admin callback(false, true)
     */
    this.isTypeAccount = function(user, callback) {
        var query = { _id: user._id, driver: { $exists: true } };
        UserModel.findOne(query, function(err, driver) {
            if (err) { throw err }
            callback(driver != null && driver != '', user.isAdmin);
        });
    };

    /**
     * Stop timers table updates admin
     * @type {Function}
     * @param {Object} user The current user
     * @this {Admin}
     */
    this.stopTimers = function(user) {
        this.isTypeAccount(user, function(isDriver, isAdmin) {
            if (isAdmin) {
                _stopTimers = true;
                log.info('ADMIN TIMERS STOPPED!'.red);
            }
        });
    };

    /**
     * Start timers table updates admin
     * @type {Function}
     * @param {Object} user The current user
     * @this {Admin}
     */
    this.startTimers = function(user) {
        this.isTypeAccount(user, function(isDriver, isAdmin) {
            if (isAdmin) {
                _stopTimers = false;
                log.info('ADMIN TIMERS STARTED!'.green);
            }
        });
    };
};

/**
 * Borrow a function in the Order
 * @type {Function}
 * @see {@link Order#genTableOrders}
 */
Admin.prototype.genTableOrders = order.genTableOrders;

/**
 * Export class Admin
 */
module.exports = Admin;
