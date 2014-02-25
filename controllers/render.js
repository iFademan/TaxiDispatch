'use strict';

var log = require('winston-wrapper')(module);

// Обертка над res.render().
module.exports = function(template, variables) {
    return function (req, res) {
        res.render(template, variables);
    };
};