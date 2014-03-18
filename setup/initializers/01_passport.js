'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('user');

/**
 * Module to authenticate via passport.js (local strategy)
 *@module {Middleware} Passport
 */
module.exports = function() {
    passport.use(new LocalStrategy({
            usernameField: 'login',
            passwordField: 'password'
        },
        function(login, password, done) {
            var messages = {
                incorrect_name: { message: 'Incorrect username.' },
                incorrect_pass: { message: 'Incorrect password.' }
            };
            User.findOne({ login: login }, function(err, user) {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, messages.incorrect_name);
                }
                if (!user.checkPassword(password)) {
                    return done(null, false, messages.incorrect_pass);
                }
                return done(null, user);
            });
        }
    ));

    passport.serializeUser(function(user, done) {
        log.info('serializeUser userName:', user.login);
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            if (err) {
                done(err);
            } else {
                log.info('deserializeUser userName:', user.login);
                done(null, user);
            }
        });
    });
};
