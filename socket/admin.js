'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var UserModel = mongoose.model('user');
var OrderModel = mongoose.model('order');
var Order = require('./order');

// TODO: нужен Event остановки таймеров clearInterval(timer);

// Список клиентов
exports.listOfClients = function(callback) {
    var findClients = { isAdmin: false, driver: { $exists: false } };
    var timer = setInterval(function() {
        UserModel.find(findClients, function(err, clients) {
            if (err) callback(err, null);
            callback(null, clients);
            log.info(('listOfClients:').yellow + ' список клиентов получен!');
        });
    }, 10 * 1000);
};

// Список свободных водителей
exports.listOfFreeDrivers = function(callback) {
    var freeDriver = { 'driver.order_id': null, driver: { $exists: true } };
    var timer = setInterval(function() {
        UserModel.find(freeDriver, function(err, drivers) {
            if (err) callback(err, null);
            log.info(('listOfFreeDrivers:').yellow + ' ищу водителя... статус: ' + config.get('status:search:key'));
            if (drivers != null && drivers != '') {
                callback(null, drivers);
                log.info(('listOfFreeDrivers:').yellow + ' нашел водителя... ', JSON.stringify(drivers));
                log.info(('listOfFreeDrivers:').yellow + ' driver_id: ' + drivers._id);
            }
        });
    }, 10 * 1000);
};

// Все новые ордера
exports.listAllNewOrders = function(callback) {
    var timer = setInterval(function() {
        OrderModel.find({ new: 'true' }, function(err, newOrders) {
            if (err) callback(err, null);
            log.info(('listAllNewOrders:').yellow + ' New order:', JSON.stringify(newOrders));
            callback(null, newOrders);
        });
    }, 10 * 1000);
};

exports.updateAdminTables = function(socket, callback) {
    var actions = [
        function(callback) { exports.listOfFreeDrivers(callback) },
        function(callback) { exports.listAllNewOrders(callback) },
        function(callback) { exports.listOfClients(callback) }
    ];
    async.series(actions, function(err, data) {
        if (err) throw err;
        var listFreeDrivers = data[0];
        var listAllNewOrders = data[1];
        var listOfClients = data[2];

        log.info(('updateTableOrders:').yellow + ' newOrder: ' + listFreeDrivers);
        log.info(('updateTableOrders:').yellow + ' oldOrders: ' + listAllNewOrders);
        log.info(('updateTableOrders:').yellow + ' oldOrders: ' + listOfClients);

        socket.emit('admin:send', {
            listFreeDrivers: exports.sendDriversForAdminTables(listFreeDrivers),
            listAllNewOrders: Order.sendTableOrders(listAllNewOrders),
            listOfClients: exports.sendClientsForAdminTables(listOfClients)
        }, function(callback) {
            log.info(('updateAdminTables:').yellow + " " + callback);
        });

        callback(data)
    });
};

exports.sendDriversForAdminTables = function(drivers) {
    var html = '';
    if (drivers != null && drivers != '' && drivers.length) {
        html += "<tbody>";
        drivers.forEach(function(driver) {
            html += "<tr>";
            html += "<td>" + driver.name + "</td>";
            html += "<td>" + driver.driver.driver_license_id + "</td>";
            html += "<td>" + driver.driver.experience + "</td>";
            html += "<td>" + driver.age + "</td>";
            html += "<td>" + driver.gender + "</td>";
            html += "</tr>";
        });
        html += "</tbody>";
        log.info(('sendDriversForAdminTables:').yellow  + ' html: ' + html.blue);
    } else {
        html = "<tbody><tr><td colspan='5' class='text-center'>" + " - empty - " + "</td></tr></tbody>"
        log.info(('sendDriversForAdminTables:').yellow  + ' html: ' + html.blue);
    }
    return html
};

exports.sendClientsForAdminTables = function(clients) {
    var html = '';
    if (clients != null && clients != '' && clients.length) {
        html += "<tbody>";
        clients.forEach(function(client) {
            html += "<tr>";
            html += "<td>" + client.name + "</td>";
            html += "<td>" + client.age + "</td>";
            html += "<td>" + client.gender + "</td>";
            html += "</tr>";
        });
        html += "</tbody>";
        log.info(('sendClientsForAdminTables:').yellow  + ' html: ' + html.blue);
    } else {
        html = "<tbody><tr><td colspan='3' class='text-center'>" + " - empty - " + "</td></tr></tbody>"
        log.info(('sendClientsForAdminTables:').yellow  + ' html: ' + html.blue);
    }
    return html
};
