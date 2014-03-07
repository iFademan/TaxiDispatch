'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var mongoose = require('mongoose');
var requireTree = require('require-tree');
// это не удалять, используется после экспорта
var models = requireTree('../../models/');

/**
 * Инициализация и подключение к базе данных через mongoose
 *@module {Middleware} Environments
 * @param {Function} done
 */
module.exports = function(done) {
    mongoose.connection.on('open', function() {
        log.info('Connected to mongo server!'.green);
        return done();
    });

    mongoose.connection.on('error', function(err) {
        log.error('Could not connect to mongo server!');
        log.error(err.message);
        done();
        return err;
    });

    try {
        mongoose.connect(config.get('mongoose:uri'),
            config.get('mongoose:options'));
        mongoose.connection;
        log.info('Started connection on ' +
            (config.get('mongoose:uri')).cyan +
            ', waiting for it to open...'.grey);
    } catch (err) {
        log.error(('Setting up failed to connect to ' +
            config.get('mongoose:uri')).red, err.message);
    }
};
