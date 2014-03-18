'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');

/**
 * Class Status
 * @constructor
 */
var Status = function() {
    /**
     * Orders in the queue
     * @type {String}
     */
    this.queue = config.get('status:queue:key');
    /**
     * Search driver
     * @type {String}
     */
    this.search = config.get('status:search:key');
    /**
     * The driver found
     * @type {String}
     */
    this.found = config.get('status:found:key');
    /**
     * Driver goes to the destination
     * @type {String}
     */
    this.going = config.get('status:going:key');
    /**
     * The driver at the destination
     * @type {String}
     */
    this.place = config.get('status:place:key');
    /**
     * The driver waits
     * @type {String}
     */
    this.waiting = config.get('status:waiting:key');
    /**
     * Driver with passenger
     * @type {String}
     */
    this.passenger = config.get('status:passenger:key');
    /**
     * Orders closed
     * @type {String}
     */
    this.close = config.get('status:close:key');
};

/**
 * Export Class Status
 * @type {Status}
 */
module.exports = Status;
