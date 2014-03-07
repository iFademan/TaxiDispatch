'use strict';

var log = require('winston-wrapper')(module);
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

/**
 * Модель ордера (заказа)
 *@module Model:Order
 * @type {Schema}
 */
var schema = new Schema({
    /**
     * ID пользователя которому принадлежит заказ.
     * Required: true
     *@membersof Model:Order
     * @type {Object}
     */
    user_id: { type: Object, required: true },
    /**
     * Адрес отправки (откуда будут ехать).
     * Required: true
     *@membersof Model:Order
     * @type {String}
     */
    start_address: { type: String, required: true },
    /**
     * Конечный адрес (куда ехать).
     * Required: true
     *@membersof Model:Order
     * @type {String}
     *@todo Нужна валидация
     */
    end_address: { type: String, required: true },
    /**
     * ID водителя назначенного на заказ
     *@membersof Model:Order
     * @type {Object}
     *@todo Нужна валидация
     */
    driver_id: { type: Object },
    /**
     * Статус заказа, возможные статусы описаны в классе {@link Status}.
     * Required: true
     *@membersof Model:Order
     * @type {String}
     * @see {@link Status}
     */
    status: { type: String, required: true },
    /**
     * Флаг нового заказа
     *@membersof Model:Order
     * @type {Boolean}
     *@default false
     */
    new: { type: Boolean, default: false },
    /**
     * Дата создания документа (создается автоматически)
     *@membersof Model:Order
     * @type {Date}
     *@default Date.now
     */
    created: { type: Date, default: Date.now }
});

mongoose.model('order', schema);
