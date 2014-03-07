'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var express = require('express');

var passportSocketIo = require('passport.socketio');
var sessionStore = require('libs/sessionStore');

/**
 * Модуль авторизации через passport.socketio
 * @param {Object} io объект socket.io
 * @constructor
 */
var SocketAuth = function(io) {
    this.io = io;

    /**
     * Конфигурация сокета для авторизациия через passport.socketio
     * @type {Function}
     * @param {Object} io объект socket.io
     * @this {SocketAuth}
     */
    this.io.configure(function() {
        var self = this;
        log.info('set authorization for socket.io');
        this.set('authorization', passportSocketIo.authorize({
            cookieParser: express.cookieParser,
            key: config.get('session:key'),
            secret: config.get('session:secret'),
            store: sessionStore,
            success: onAuthorizeSuccess,
            fail: onAuthorizeFail
        }));
    });
};

/**
 * @type {Function}
 * @private
 * @param {Object} data
 * @param {Function} accept
 *@memberof SocketAuth
 */
function onAuthorizeSuccess(data, accept) {
    log.info('successful connection to socket.io');
    // The accept-callback still allows us to decide whether to
    // accept the connection or not.
    accept(null, true);
}

/**
 * @type {Function}
 * @private
 * @param {Object} data
 * @param {String} message
 * @param {Error} error
 * @param {Function} accept
 *@memberof SocketAuth
 */
function onAuthorizeFail(data, message, error, accept) {
    if (error) throw new Error(message);
    log.info('failed connection to socket.io:', message);
    // We use this callback to log all of our failed connections.
    accept(null, false);
}

/**
 * Экспортим класс SocketAuth;
 * @type {Function}
 */
module.exports = SocketAuth;
