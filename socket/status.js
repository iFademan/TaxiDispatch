'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');

/**
 * Класс Status
 * @constructor
 */
var Status = function() {
    /**
     * Заказ в очереди
     * @type {String}
     */
    this.queue = config.get('status:queue:key');
    /**
     * Поиск водителя
     * @type {String}
     */
    this.search = config.get('status:search:key');
    /**
     * Водитель найден
     * @type {String}
     */
    this.found = config.get('status:found:key');
    /**
     * Водитель едет к месту назначения
     * @type {String}
     */
    this.going = config.get('status:going:key');
    /**
     * Водитель на месте назначения
     * @type {String}
     */
    this.place = config.get('status:place:key');
    /**
     * Водитель ожидает
     * @type {String}
     */
    this.waiting = config.get('status:waiting:key');
    /**
     * Водитель с пассажиром
     * @type {String}
     */
    this.passenger = config.get('status:passenger:key');
    /**
     * Заказ закрыт
     * @type {String}
     */
    this.close = config.get('status:close:key');
};

/**
 * Экспортим класс Status
 * @type {Status}
 */
module.exports = Status;
