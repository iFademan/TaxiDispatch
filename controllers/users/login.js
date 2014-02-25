'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var passport = require('passport');

module.exports = function(req, res, next) {
    log.info('кто-то пытается войти');
    passport.authenticate('local',
        function(err, user, info) {
            log.info('user:', user.login);
            return err ? next(err) : user
            ? req.logIn(user, function(err) {
                return err
                ? next(err)
                : user.isAdmin
                ? res.redirect('/admin')
                : res.redirect('/order')
            })
            : res.redirect('/login');
        }
    )(req, res, next);
};