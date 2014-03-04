'use strict';

var log = require('winston-wrapper')(module);

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
