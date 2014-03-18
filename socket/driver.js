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
 * Class Driver solves the problem of obtaining and updating data
 * for the panel driver. Table of orders designated driver
 * is updated every 10 seconds.
 * @constructor
 */
var Driver = function() {
    /**
     * Property stop / start timer
     * @private
     * @type {Boolean}
     */
    var _stopTimers = false;

    /**
     * Search order designated driver, the order may be only one
     * @type {Function}
     * @param {Object} user the current user
     * @param {Function} callback Error callback(null),
     * order callback([order])
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
     * Private function for multiple call findAssignedOrders
     * @type {Function}
     * @private
     * @param {Object} user the current user
     * @param {Function} callback Error callback(null),
     * order callback([order])
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
     * Stop timers table updates the driver
     * @type {Function}
     * @param {Object} user the current user
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
     * Running timers table updates the driver
     * @type {Function}
     * @param {Object} user the current user
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
 * Borrow a function in the Admin
 * @type {Function}
 * @see {@link Admin#isTypeAccount}
 */
Driver.prototype.isTypeAccount = admin.isTypeAccount;

/**
 * Export Class Driver
 */
module.exports = Driver;
