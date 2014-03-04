'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');

var Status = function() {};

var StatusFunc = {
    queue: config.get('status:queue:key'),

    search: config.get('status:search:key'),

    found: config.get('status:found:key'),

    going: config.get('status:going:key'),

    place: config.get('status:place:key'),

    waiting: config.get('status:waiting:key'),

    passenger: config.get('status:passenger:key'),

    close: config.get('status:close:key')
};

Status.prototype = StatusFunc;

module.exports = Status;
