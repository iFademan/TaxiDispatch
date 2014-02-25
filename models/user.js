'use strict';

var log = require('winston-wrapper')(module);
var mongoose = require('mongoose');
var crypto = require('crypto');
var async = require('async');
var util = require('util');

var Schema = mongoose.Schema;

var schema = new Schema({
    login: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    age: { type: String, required: true },
    smoke: { type: Boolean, required: true },
    gender: { type: String, required: true },
    driver: {
        driver_license_id: Number,
        experience: Number,
        order_id: { type: Object }
    },
    isAdmin: { type: Boolean, default: false },
    hashedPassword: { type: String, required: true },
    salt: { type: String, required: true },
    created: { type: Date, default: Date.now }
});

schema.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

schema.virtual('password').set(function(password) {
    this._plainPassword = password;
    this.salt = Math.random() + '';
    this.hashedPassword = this.encryptPassword(password);
}).get(function() { return this._plainPassword; });

schema.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
};

mongoose.model('user', schema);