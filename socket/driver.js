'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var OrderModel = mongoose.model('order');
var UserModel = mongoose.model('user');
var Admin = require('./admin');

var admin = new Admin();

var Driver = function() {};

var DriverFunc = {
    _stopTimers: false,

    findAssignedOrders: function(user, callback) {
        var self = this;
        var timer = setTimeout(function() {
            self.timerFunc(user, callback);
            self.findAssignedOrders(user, callback);
        }, 10 * 1000);

        if (self._stopTimers) {
            clearTimeout(timer);
        }
    },

    timerFunc: function(user, callback) {
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
    },

    stopTimers: function(user) {
        var self = this;
        this.isTypeAccount(user, function(isDriver, isAdmin) {
            if (isDriver) {
                self._stopTimers = true;
                log.info('DRIVER TIMERS STOPPED!'.red);
            }
        });
    },

    startTimers: function(user) {
        var self = this;
        this.isTypeAccount(user, function(isDriver, isAdmin) {
            if (isDriver) {
                self._stopTimers = false;
                log.info('DRIVER TIMERS STARTED!'.green);
            }
        });
    }
};

DriverFunc.isTypeAccount = admin.isTypeAccount;

Driver.prototype = DriverFunc;

module.exports = Driver;
