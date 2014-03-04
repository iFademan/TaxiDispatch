'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var passport = require('passport');

module.exports = function(req, res, next) {
    var server = req.app.get('server');
    log.info('кто-то пытается войти');
    passport.authenticate('local',
        function(err, user, info) {
            if (err) { next(err) }
            if (user) {
                log.info('user:', user.login);
                server.emit('login', user);
                req.logIn(user, function(err) {
                    return err ? next(err) :
                    user.isAdmin ? res.redirect('/admin') :
                    res.redirect('/order')
                });
            } else {
                res.redirect('/login');
            }
        }
    )(req, res, next);
};
