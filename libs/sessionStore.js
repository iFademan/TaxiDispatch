var mongoose = require('mongoose');
var express = require('express');
var MongoStore = require('connect-mongo')(express);

var sessionStore = new MongoStore({ mongoose_connection: mongoose.connection });

/**
 * Экспортим хранилище сессий
 * @type {MongoStore}
 */
module.exports = sessionStore;
