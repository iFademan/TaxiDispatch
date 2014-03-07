'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var mongoose = require('mongoose');
var User = mongoose.model('user');
var Order = mongoose.model('order');

/**
 * Регистрация нового пользователя
 *@module {Middleware} Register
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @see {@link module Model:User}
 */
module.exports = function(req, res, next) {
    /**
     * Формируем объект для регистрации, поля для обычного пользователя
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
     * Водительская часть данных
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
     * Создаем и сохраняем пользователя в user
     * @private
     * @type {User}
     */
    var user = new User(simpleUser);
    log.info(JSON.stringify(user));

    /**
     * Сохраняем в базе и при успешной регистрации редиректим на траницу заказов
     */
    user.save(function(err) {
        return err ? next(err) : req.login(user, function(err) {
            return err ? next(err) : res.redirect('/order');
        });
    });
};
