'use strict';

var HttpError = require('error').HttpError;
var log = require('winston-wrapper')(module);

module.exports = function (req, res, next) {
    log.info('CheckAuth: ', req.isAuthenticated());
    if (!req.isAuthenticated()) {
        res.redirect('/');
    }
    next();
};