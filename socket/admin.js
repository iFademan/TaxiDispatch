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
 * Класс админа, решает задачи получения и обновления данных
 * для админской панели. Все таблицы обновляются с интервалом в 10 сек.
 * @constructor
 */
var Admin = function() {
    /**
     * Свойство остановки/запуска таймеров
     * @private
     * @type {Boolean}
     */
    var _stopTimers = false;

    /**
     * Получаем список клиентов
     * @type {Function}
     * @param {Function} callback Клиенты callback(null, clients),
     * ошибка callback(err, null)
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
     * Получаем список свободных водителей
     * @type {Function}
     * @param {Function} callback Водители callback(null, drivers),
     * ошибка callback(err, null)
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
     * Получаем все новые ордера
     * @type {Function}
     * @param {Function} callback Новые ордера callback(null, newOrders),
     * ошибка callback(err, null)
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
     * Обновляет все таблицы в режиме администратора
     * @type {Function}
     * @param {Object} socket объект socket.io
     * @param {Function} callback Возвращает 3 курсора в объекте data
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
     * Создает html-таблицу для свободных водителей
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
     * Создает html-таблицу для всех клиентов
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
     * Определяем тип пользователя
     * @type {Function}
     * @param {Object} user текущий пользователь
     * @param {Function} callback Водитель callback(true, false),
     * клиент callback(false, false), админ callback(false, true)
     */
    this.isTypeAccount = function(user, callback) {
        var query = { _id: user._id, driver: { $exists: true } };
        UserModel.findOne(query, function(err, driver) {
            if (err) { throw err }
            callback(driver != null && driver != '', user.isAdmin);
        });
    };

    /**
     * Остановка таймеров обновления таблиц админа
     * @type {Function}
     * @param {Object} user текущий пользователь
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
     * Старт таймеров обновления таблиц админа
     * @type {Function}
     * @param {Object} user текущий пользователь
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
 * Заимствуем функцию из класса Order
 * @type {Function}
 * @see {@link Order#genTableOrders}
 */
Admin.prototype.genTableOrders = order.genTableOrders;

/**
 * Экспортим класс Admin
 */
module.exports = Admin;
