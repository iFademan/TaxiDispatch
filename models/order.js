'use strict';

var log = require('winston-wrapper')(module);
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var schema = new Schema({
    user_id: { type: Object, required: true },
    start_address: { type: String, required: true },
    end_address: { type: String, required: true },
    driver_id: { type: Object },
    status: { type: String, required: true },
    new: { type: Boolean, default: false },
    created: { type: Date, default: Date.now }
});

mongoose.model('order', schema);
