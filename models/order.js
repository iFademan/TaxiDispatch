'use strict';

var log = require('winston-wrapper')(module);
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

/**
 * Model Order
 *@module Model:Order
 * @type {Schema}
 */
var schema = new Schema({
    /**
     * User ID that owns the order
     * Required: true
     *@membersof Model:Order
     * @type {Object}
     */
    user_id: { type: Object, required: true },
    /**
     * Start address (where will go).
     * Required: true
     *@membersof Model:Order
     * @type {String}
     */
    start_address: { type: String, required: true },
    /**
     * End address (where to go).
     * Required: true
     *@membersof Model:Order
     * @type {String}
     *@todo Need validation
     */
    end_address: { type: String, required: true },
    /**
     * Id driver assigned to order
     *@membersof Model:Order
     * @type {Object}
     *@todo Need validation
     */
    driver_id: { type: Object },
    /**
     * Order status, possible statuses are described
     * in the class {@link Status}.
     * Required: true
     *@membersof Model:Order
     * @type {String}
     * @see {@link Status}
     */
    status: { type: String, required: true },
    /**
     * The flag of the new order
     *@membersof Model:Order
     * @type {Boolean}
     *@default false
     */
    new: { type: Boolean, default: false },
    /**
     * Date of creating document (created automatically)
     *@membersof Model:Order
     * @type {Date}
     *@default Date.now
     */
    created: { type: Date, default: Date.now }
});

mongoose.model('order', schema);
