'use strict';

var log = require('winston-wrapper')(module);

/**
 * A small extension logger, adding time
 *@module ExpressLog
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function(req, res, next) {
    var date = new Date();
    var hh = date.getHours();
    var mm = date.getMinutes();
    var time = hh + ':' + mm;

    log.info(time, '[' + req.method.grey + ']:', req.url);
    next();
};
