'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var mongoose = require('mongoose');
var User = mongoose.model('user');
var Order = mongoose.model('order');

/**
 * New User Registration
 *@module {Middleware} Register
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @see {@link module Model:User}
 */
module.exports = function(req, res, next) {
    /**
     * Forming object to register, field for the normal user
     * @private
     * @type {Object}
     */
    var simpleUser = {
        login: req.body.login,
        password: req.body.password,
        name: req.body.fullname,
        age: req.body.age,
        gender: req.body.radioGender,
        smoke: req.body.checkSmoking == 'on'
    };

    /**
     * Driver of the data
     * @private
     * @type {Object}
     */
    var driver = {
        driver_license_id: req.body.driverLicenseId,
        experience: req.body.experience,
        order_id: null
    };

    if (req.body.checkDrivers == 'on') {
        simpleUser.driver = driver;
    }

    /**
     * Create and store user variable user
     * @private
     * @type {User}
     */
    var user = new User(simpleUser);
    log.info(JSON.stringify(user));

    /**
     * Stored in a database and if successful registration redirect
     * to order page
     */
    user.save(function(err) {
        return err ? next(err) : req.login(user, function(err) {
            return err ? next(err) : res.redirect('/order');
        });
    });
};
