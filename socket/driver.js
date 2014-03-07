'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var OrderModel = mongoose.model('order');
var UserModel = mongoose.model('user');
var Admin = require('./admin');

var admin = new Admin();

/**
 * Класс водителя, решает задачи получения и обновления данных
 * для панели водителя. Таблица ордеров назначенных водителю,
 * обновляется каждые 10 сек.
 * @constructor
 */
var Driver = function() {
    /**
     * Свойство остановки/запуска таймеров
     * @private
     * @type {Boolean}
     */
    var _stopTimers = false;

    /**
     * поиск заказа назначенного водителю, заказ может быть только один
     * @type {Function}
     * @param {Object} user текущий пользователь
     * @param {Function} callback Ошибка callback(null),
     * заказ callback([order])
     * @this {Driver}
     */
    this.findAssignedOrders = function(user, callback) {
        var self = this;
        var timer = setTimeout(function() {
            _timerFunc(user, callback);
            self.findAssignedOrders(user, callback);
        }, 10 * 1000);

        if (_stopTimers) {
            clearTimeout(timer);
        }
    };

    /**
     * Приватная функция для многократного вызова в findAssignedOrders
     * @type {Function}
     * @private
     * @param {Object} user текущий пользователь
     * @param {Function} callback Ошибка callback(null),
     * заказ callback([order])
     */
    var _timerFunc = function(user, callback) {
        var queryDriver = { _id: user._id, 'driver.order_id': { $ne: null } };
        UserModel.findOne(queryDriver, function(err, driver) {
            if (err) { throw err }
            callback(null);
            if (driver != '' && driver != null) {
                var queryOrder = { _id: driver.driver.order_id };
                OrderModel.findOne(queryOrder, function(err, order) {
                    if (err) { throw err }
                    callback([order]);
                });
            }
        });
    };

    /**
     * Остановка таймеров обновления таблиц водителя
     * @type {Function}
     * @param {Object} user текущий пользователь
     * @this {Driver}
     */
    this.stopTimers = function(user) {
        this.isTypeAccount(user, function(isDriver, isAdmin) {
            if (isDriver) {
                _stopTimers = true;
                log.info('DRIVER TIMERS STOPPED!'.red);
            }
        });
    };

    /**
     * Запуск таймеров обновления таблиц водителя
     * @type {Function}
     * @param {Object} user текущий пользователь
     * @this {Driver}
     */
    this.startTimers = function(user) {
        this.isTypeAccount(user, function(isDriver, isAdmin) {
            if (isDriver) {
                _stopTimers = false;
                log.info('DRIVER TIMERS STARTED!'.green);
            }
        });
    };
};

/**
 * Заимствуем функцию из класса Admin
 * @type {Function}
 * @see {@link Admin#isTypeAccount}
 */
Driver.prototype.isTypeAccount = admin.isTypeAccount;

/**
 * Экспортим класс Driver
 */
module.exports = Driver;
