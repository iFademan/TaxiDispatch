'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var OrderModel = mongoose.model('order');
var UserModel = mongoose.model('user');

exports.searchAssignedOrders = function(user, callback) {
    var timer = setInterval(function() {
        UserModel.findOne( { _id: user._id, 'driver.order_id': { $ne : null } }, function(err, driver) {
            if (err) throw err;
            if (driver != '' && driver != null) {
                OrderModel.findOne({ _id: driver.driver.order_id }, function(err, order) {
                    if (err) throw err;
                    callback([order]);
                });
            }
        });
    }, 10 * 1000);

    // нужен ивент остановки таймера
    //clearInterval(timer);
};