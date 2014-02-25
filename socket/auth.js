'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var express = require('express');

var passportSocketIo = require("passport.socketio");
var sessionStore = require('libs/sessionStore');


module.exports = function(io) {
    io.configure(function() {
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

    function onAuthorizeSuccess(data, accept) {
        log.info('successful connection to socket.io');
        // The accept-callback still allows us to decide whether to
        // accept the connection or not.
        accept(null, true);
    }

    function onAuthorizeFail(data, message, error, accept) {
        if (error) throw new Error(message);
        log.info('failed connection to socket.io:', message);
        // We use this callback to log all of our failed connections.
        accept(null, false);
    }
};
