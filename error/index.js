var path = require('path');
var util = require('util');
var http = require('http');

/**
 * Extension of the class Error, is not used
 * @param {Number} status Error code
 * @param {String} message Message for user
 * @constructor
 */
function HttpError(status, message) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, HttpError);

    this.status = status;
    this.message = message || http.STATUS_CODES[status] || 'Error';
}

util.inherits(HttpError, Error);

/**
 * Class type
 * @type {string}
 */
HttpError.prototype.name = 'HttpError';

exports.HttpError = HttpError;
