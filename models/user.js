'use strict';

var log = require('winston-wrapper')(module);
var mongoose = require('mongoose');
var crypto = require('crypto');
var async = require('async');
var util = require('util');

var Schema = mongoose.Schema;

/**
 * Model User
 *@module Model:User
 * @type {Schema}
 */
var schema = new Schema({
    /**
     * Name for the user logon.
     * Unique: true, required: true
     *@membersof Model:User
     * @type {String}
     * */
    login: { type: String, unique: true, required: true },
    /**
     * Name, user's real name.
     * Required: true
     *@membersof Model:User
     * @type {String}
     *@todo Need validation
     * */
    name: { type: String, required: true },
    /**
     * Year of birth (пока String с Date какой-то косяк при записи в базу).
     * Required: true
     *@membersof Model:User
     * @type {String}
     *@todo Need validation
     */
    age: { type: String, required: true },
    /**
     * Smoking (smoking is whether the user).
     * Required: true
     *@membersof Model:User
     * @type {Boolean}
     */
    smoke: { type: Boolean, required: true },
    /**
     * Gender.
     * Required: true
     *@membersof Model:User
     * @type {String}
     */
    gender: { type: String, required: true },
    /**
     * Driver (if the user driver, then add an attachment document).
     * Required: false
     *@membersof Model:User
     * @type {Object}
     */
    driver: {
        /**
         * Driver's license number
         * @type {Number}
         *@todo Нужна валидация
         */
        driver_license_id: Number,
        /**
         * Driving experience
         * @type {Number}
         *@todo нужна валидация
         */
        experience: Number,
        /**
         * Order ID
         * @type {Object}
         */
        order_id: { type: Object }
    },
    /**
     * Admin flag
     *@membersof Model:User
     * @type {Boolean}
     *@default false
     */
    isAdmin: { type: Boolean, default: false },
    /**
     * Hashed password. Required: true
     *@membersof Model:User
     * @type {String}
     */
    hashedPassword: { type: String, required: true },
    /**
     * Salt :). Required: true
     *@membersof Model:User
     * @type {String}
     */
    salt: { type: String, required: true },
    /**
     * Date of creating document (created automatically)
     *@membersof Model:User
     * @type {Date}
     *@default Date.now
     */
    created: { type: Date, default: Date.now }
});

/**
 * Encrypt password
 * @param {String} password Password from the form
 * @return {*} Encrypted password
 * @type {Function}
 * @this {schema}
 */
schema.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

/**
 * Create and store an encrypted password in the appropriate fields
 * when creating a user
 */
schema.virtual('password').set(function(password) {
    this._plainPassword = password;
    this.salt = Math.random() + '';
    this.hashedPassword = this.encryptPassword(password);
}).get(function() { return this._plainPassword; });

/**
 * Checking validity password
 * @param {String} password Password from the form
 * @return {boolean} Coincidence of the encoded part a password
 * @type {Function}
 * @this {schema}
 */
schema.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
};

mongoose.model('user', schema);
