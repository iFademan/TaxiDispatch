'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var mongoose = require('mongoose');
var User = mongoose.model('user');
var Order = mongoose.model('order');

module.exports = function(req, res, next) {
    var simpleUser = {
        login: req.body.login,
        password: req.body.password,
        name: req.body.fullname,
        age: req.body.age,
        gender: req.body.radioGender,
        smoke: req.body.checkSmoking == 'on'
    };

    var driver = {
        driver_license_id: req.body.driverLicenseId,
        experience: req.body.experience,
        order_id: null
    };

    if (req.body.checkDrivers == 'on') {
        simpleUser.driver = driver;
    }

    var user = new User(simpleUser);
    log.info(JSON.stringify(user));

    user.save(function(err) {
        return err
        ? next(err)
        : req.login(user, function(err) {
            return err
            ? next(err)
            : res.redirect('/order');
        });
    });
};