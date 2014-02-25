'use strict';

var path = require('path');
var log = require('winston-wrapper')(module);
var config = require('config');
var cons = require('consolidate');
var express = require('express');
var requireTree = require('require-tree');
var middleware = requireTree('../../middleware');
var sessionStore = require('libs/sessionStore');
var mongoose = require('mongoose');
var User = mongoose.model('user');
var passport = require('passport');

module.exports = function() {
    this.engine('jade', cons.jade);
    this.set('view engine', 'jade');
    this.set('views', path.join(__dirname, '../../views'));
    this.use(express.favicon());
    this.use(middleware.expressLog);
    this.use(express.cookieParser());
    this.use(express.bodyParser());
    this.use(express.session({
        secret: config.get('session:secret'),
        key: config.get('session:key'),
        cookie: config.get('session:cookie'),
        store: sessionStore
    }));
    this.use(express.methodOverride());

    this.use(passport.initialize());
    this.use(passport.session());

    this.use(this.router);
    this.use(express.static(path.join(__dirname, '../../public')));
};