'use strict';

var log = require('winston-wrapper')(module);

/**
 * User verification on the flag admin
 *@module {Middleware} CheckAdmin
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function(req, res, next) {
    log.info('CheckAdmin: ', req.isAuthenticated());
    if (req.isAuthenticated()) {
        if (req.user && req.user.isAdmin === true) {
            next();
        }
    } else {
        res.redirect('/login');
    }
};
