'use strict';

var log = require('winston-wrapper')(module);

/**
 * Обертка над res.render(), применение смотреть в {@link module:Routes}
 * @see {@link module:Routes}
 *@module Render
 * @param {String} template путь к шаблону
 * @param {Object} variables объект с данными для шаблона
 * @return {Function}
 */
module.exports = function(template, variables) {
    return function(req, res) {
        res.render(template, variables);
    };
};
