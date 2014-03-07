'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var passport = require('passport');
/**
 * Авторизуемся через passport, определяем тип пользователя и редиректим
 * админа "/admin", водителя или клиента "/order", если авторизация неудачна,
 * то редиректим на форму ввода авторизационных данных "/login". Так же вызываем
 * серверное событие emit('login')
 *@module {Middleware} Login
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @see {@link module:Socket}
 *@example
 * server.addListener('login', function(user) {
 *      admin.startTimers(user);
 *      driver.startTimers(user);
 * });
 */
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
