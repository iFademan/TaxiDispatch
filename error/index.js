var path = require('path');
var util = require('util');
var http = require('http');

/**
 * Расширение класса Error, пока не используется
 * @param {Number} status код ошибки
 * @param {String} message сообщение
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
 * Тип класса
 * @type {string}
 */
HttpError.prototype.name = 'HttpError';

exports.HttpError = HttpError;
