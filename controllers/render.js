'use strict';

var log = require('winston-wrapper')(module);

/**
 * Wrapper over res.render(), look at the use of {@link module:Routes}
 * @see {@link module:Routes}
 *@module Render
 * @param {String} template Template path
 * @param {Object} variables Template data
 * @return {Function}
 */
module.exports = function(template, variables) {
    return function(req, res) {
        res.render(template, variables);
    };
};
