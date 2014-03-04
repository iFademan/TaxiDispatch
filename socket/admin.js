'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var UserModel = mongoose.model('user');
var OrderModel = mongoose.model('order');
var Order = require('./order');

var order = new Order();

var Admin = function() {};

var AdminFunc = {
    _stopTimers: false,

    // Список клиентов
    listOfClients: function(callback) {
        var self = this;
        var findClients = { isAdmin: false, driver: { $exists: false } };
        var timer = setTimeout(function() {
            UserModel.find(findClients, function(err, clients) {
                if (err) callback(err, null);
                callback(null, clients);
            });
            self.listOfClients(callback);
        }, 10 * 1000);

        if (self._stopTimers) {
            clearTimeout(timer);
        }
    },

    // Список свободных водителей
    listOfFreeDrivers: function(callback) {
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

        if (self._stopTimers) {
            clearTimeout(timer);
        }
    },

    // Все новые ордера
    listAllNewOrders: function(callback) {
        var self = this;
        var timer = setTimeout(function() {
            OrderModel.find({ new: 'true' }, function(err, newOrders) {
                if (err) callback(err, null);
                callback(null, newOrders);
            });
            self.listAllNewOrders(callback);
        }, 10 * 1000);

        if (self._stopTimers) {
            clearTimeout(timer);
        }
    },

    updateAdminTables: function(socket, callback) {
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
                listAllNewOrders: self.sendTableOrders(listAllNewOrders),
                listOfClients: self.sendClientsTable(listOfClients)
            }, function(callback) {
                log.info(('updateAdminTables:').yellow + ' ' + callback);
            });

            callback(data);
        });
    },

    sendDriversTable: function(drivers) {
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
    },

    sendClientsTable: function(clients) {
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
    },

    // Водитель /клиент/админ
    isTypeAccount: function(user, callback) {
        var query = { _id: user._id, driver: { $exists: true } };
        UserModel.findOne(query, function(err, driver) {
            if (err) { throw err }
            callback(driver != null && driver != '', user.isAdmin);
        });
    },

    stopTimers: function(user) {
        var self = this;
        this.isTypeAccount(user, function(isDriver, isAdmin) {
            if (isAdmin) {
                self._stopTimers = true;
                log.info('ADMIN TIMERS STOPPED!'.red);
            }
        });
    },

    startTimers: function(user) {
        var self = this;
        this.isTypeAccount(user, function(isDriver, isAdmin) {
            if (isAdmin) {
                self._stopTimers = false;
                log.info('ADMIN TIMERS STARTED!'.green);
            }
        });
    }
};

AdminFunc.sendTableOrders = order.sendTableOrders;

Admin.prototype = AdminFunc;

module.exports = Admin;
