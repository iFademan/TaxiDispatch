'use strict';

var HttpError = require('error').HttpError;
var log = require('winston-wrapper')(module);

/**
 * Проверка пользователя на аутентификацию
 *@module {Middleware} CheckAuth
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function(req, res, next) {
    log.info('CheckAuth: ', req.isAuthenticated());
    if (!req.isAuthenticated()) {
        res.redirect('/');
    }
    next();
};
