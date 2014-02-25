'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var requireTree = require('require-tree');
var controllers = requireTree('../controllers');
var middleware = requireTree('../middleware');

module.exports = function() {
    // Get user for views
    this.all('*', middleware.userHelper);

    // Only for registred users
    this.all('/order', middleware.checkAuth);
    this.all('/order/*', middleware.checkAuth);
    this.all('/admin', middleware.checkAdmin);
    this.all('/admin/*', middleware.checkAdmin);

    // Basic routes
    this.get('/', controllers.render('index', {
        title: 'Home'
    }));
    this.get('/admin', controllers.users.admin);
    this.get('/login', controllers.render('login', {
        title: 'Login'
    }));
    this.get('/register', controllers.render('register', {
        title: 'Register'
    }));

    this.get('/order', controllers.orders.order);

    // Auth controllers
    this.post('/login', controllers.users.login);
    this.post('/register', controllers.users.register);
    this.get('/logout', controllers.users.logout);
};