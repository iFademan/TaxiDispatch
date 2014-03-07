'use strict';

var log = require('winston-wrapper')(module);
var mongoose = require('mongoose');
var crypto = require('crypto');
var async = require('async');
var util = require('util');

var Schema = mongoose.Schema;

/**
 * Модель пользователя
 *@module Model:User
 * @type {Schema}
 */
var schema = new Schema({
    /**
     * Имя для входа пользователя в систему.
     * Unique: true, required: true
     *@membersof Model:User
     * @type {String}
     * */
    login: { type: String, unique: true, required: true },
    /**
     * Имя, настоящее имя пользователя.
     * Required: true
     *@membersof Model:User
     * @type {String}
     *@todo Нужна валидация
     * */
    name: { type: String, required: true },
    /**
     * Год рождения (пока String с Date какой-то косяк при записи в базу).
     * Required: true
     *@membersof Model:User
     * @type {String}
     *@todo Нужна валидация
     */
    age: { type: String, required: true },
    /**
     * Курение (курить ли пользователь).
     * Required: true
     *@membersof Model:User
     * @type {Boolean}
     */
    smoke: { type: Boolean, required: true },
    /**
     * Пол.
     * Required: true
     *@membersof Model:User
     * @type {String}
     */
    gender: { type: String, required: true },
    /**
     * Водитель (если пользователь водитель, то добавится вложенный документ).
     * Required: false
     *@membersof Model:User
     * @type {Object}
     */
    driver: {
        /**
         * Номер водтельского удостоверения
         * @type {Number}
         *@todo Нужна валидация
         */
        driver_license_id: Number,
        /**
         * Опыт вождения
         * @type {Number}
         *@todo нужна валидация
         */
        experience: Number,
        /**
         * ID заказа
         * @type {Object}
         */
        order_id: { type: Object }
    },
    /**
     * Идентификатор админа
     *@membersof Model:User
     * @type {Boolean}
     *@default false
     */
    isAdmin: { type: Boolean, default: false },
    /**
     * Типа пароль :). Required: true
     *@membersof Model:User
     * @type {String}
     */
    hashedPassword: { type: String, required: true },
    /**
     * Соль :). Required: true
     *@membersof Model:User
     * @type {String}
     */
    salt: { type: String, required: true },
    /**
     * Дата создания документа (создается автоматически)
     *@membersof Model:User
     * @type {Date}
     *@default Date.now
     */
    created: { type: Date, default: Date.now }
});

/**
 * Шифруем пароль
 * @param {String} password пароль из формы
 * @return {*} шифрованный пароль
 * @type {Function}
 * @this {schema}
 */
schema.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

/**
 * Создаем шифрованный пароль и сохраняем в соответствующие поля
 * при создании пользователя
 */
schema.virtual('password').set(function(password) {
    this._plainPassword = password;
    this.salt = Math.random() + '';
    this.hashedPassword = this.encryptPassword(password);
}).get(function() { return this._plainPassword; });

/**
 * Проверка валидности пароля
 * @param {String} password собственно пароль из формы
 * @return {boolean} совпадание кодированной части пароля
 * @type {Function}
 * @this {schema}
 */
schema.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
};

mongoose.model('user', schema);
