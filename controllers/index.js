'use strict';

var log = require('winston-wrapper')(module);

module.exports = function(req, res, next) {
    res.redirect('/');
};