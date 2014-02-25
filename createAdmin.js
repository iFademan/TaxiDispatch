'use strict';

var mongoose = require('mongoose');
var async = require('async');
var config = require('config');
var log = require('winston-wrapper')(module);

var express = require('express');
var bootable = require('bootable');
var bootableEnv = require('bootable-environment');

var app = bootable(express());

// Setup initializers
app.phase(bootable.initializers('setup/initializers/'));

// Setup environments
app.phase(bootableEnv('setup/environments/', app));

// Setup routes
app.phase(bootable.routes('routes/', app));

// Boot app
app.boot(function(err) {
    var UserModel = mongoose.model('user');

    if (err) throw err;
    var server = require('http').createServer(app);
    server.listen(config.get('port'), function() {
        log.info('Express server listening on port ' + config.get('port'));
    });

    async.series([
        //dropDatabase,
        createAdmin
    ], function(err) {
        console.log(arguments);
        mongoose.disconnect();
        process.exit(err ? 255 : 0);
    });

    function dropDatabase(callback) {
        var db = mongoose.connection.db;
        db.dropDatabase(callback);
    }

    function createAdmin(callback) {
        var users = [
            { login: 'Admin', name: 'Admin', age: '01/01/1970', smoke: false, gender: 'm', isAdmin: true, password: '111' }
        ];

        async.each(users, function(userData, callback) {
            var user = new UserModel(userData);
            user.save(callback);
        }, callback);
    }
});



