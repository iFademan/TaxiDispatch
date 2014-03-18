'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var OrderModel = mongoose.model('order');
var Order = require('./order');
var Driver = require('./driver');
var Admin = require('./admin');
var Status = require('./status');
var SocketAuth = require('./auth');

/**
 * The main event-loop
 *@module Socket
 * @param {EventEmitter} server
 * @return {Object} io the object of socket.io
 */
module.exports = function(server) {

    var order = new Order();
    var admin = new Admin();
    var driver = new Driver();
    var status = new Status();

    /**
     * Socket on the server side
     *@global
     *@example
     * var io = require('socket.io').listen(server);
     */
    var io = require('socket.io').listen(server);

    io.set('origins', 'localhost:*');
    io.set('logger', log);
    io.set('transports', [
        'websocket',
        'xhr-polling',
        'jsonp-polling'
    ]);

    new SocketAuth(io);

    /**
     * After joining subscribe to other events, we obtain the user, etc.
     *@event module:Socket#connection
     */
    io.sockets.on('connection', function(socket) {
        var user = socket.handshake.user;

        /**
         * Create order
         *@event module:Socket#orders:create
         */
        socket.on('orders:create', function(data, callback) {
            var simpleOrder = {
                user_id: user._id,
                start_address: data.startAddress,
                end_address: data.endAddress,
                status: status.queue,
                new: true
            };

            var orderModel = new OrderModel(simpleOrder);
            orderModel.save(function(err) {
                if (err) throw err;
                /**
                 * Generates an internal call to update the event orders
                 */
                socket.$emit('orders:update', callback);
            });
        });

        /**
         * Update orders and panel header
         *@event module:Socket#orders:update
         */
        socket.on('orders:update', function(callback) {
            order.updateTableOrders(socket, function(orders) {
                callback('orders updated!');
                log.info(('SocketEvent:Update ').blue + 'orders updated!');
            });

            updateSpecialTables(user);
        });

        /**
         * Obtain data for the admin's panel
         *@event module:Socket#admin:data
         */
        socket.on('admin:data', function(callback) {
            admin.updateAdminTables(socket, function() {});
        });

        /**
         * Get orders assigned to the driver
         *@event module:Socket#drivers:assigned
         */
        socket.on('drivers:assigned', function(socketCallBack) {
            driver.findAssignedOrders(user, function(assignedOrders) {
                socket.emit('drivers:getAssigned', {
                    assignedOrders: order.genTableOrders(assignedOrders)
                }, function(callback) {
                    socketCallBack('orders driver ' + user.login + ' update!');
                    log.info(('SocketEvent:Update ').blue + callback);
                });
            });
        });

        /**
         * Run orders processing
         *@event module:Socket#orders:apply
         */
        socket.on('orders:apply', function(socketCallback) {
            getNewOrder(function(newOrder) {
                var args = {
                    socket: socket,
                    order: newOrder
                };
                actions(args, socketCallback);
            });
        });

        /**
         * Sequential change in status of the order (hereinafter the status
         * change can make the buttons in the driver's account, so that
         * the driver can itself change its status on the fact).
         * Is now done automatically change status for visual demonstration
         * of the functional
         * @param {Object} args args.socket our socket, args.order new order
         * @param {Function} socketCallback callback for the client
         * has been successfully delivered (this is for debugging)
         */
        var actions = function(args, socketCallback) {
            async.series([
                function(callback) {
                    order.changeStatus(args, 1, status.search, callback);
                },
                function(callback) {
                    order.setFreeDriverOnOrder(args, 5, callback);
                },
                function(callback) {
                    order.changeStatus(args, 10, status.found, callback);
                },
                function(callback) {
                    order.changeStatus(args, 5, status.going, callback);
                },
                function(callback) {
                    order.changeStatus(args, 10, status.place, callback);
                },
                function(callback) {
                    order.changeStatus(args, 10, status.waiting, callback);
                },
                function(callback) {
                    order.changeStatus(args, 5, status.passenger, callback);
                },
                function(callback) {
                    order.changeStatus(args, 10, status.close, callback);
                }
            ], function(err) {
                if (err) { throw err }
                log.info(('SocketEvent:').blue + 'order is executed!');
                socketCallback('order is executed!');

                /**
                 * When the order is processed and released the driver,
                 * make an internal call event orders: apply for next order
                 */
                order.setFreeDriver(args.order, function(driver) {
                    socket.$emit('orders:apply', socketCallback);
                });
            });
        };

        /**
         * Get the first new order (one)
         * @type {Function}
         * @param {Function} callback return new order
         */
        var getNewOrder = function(callback) {
            order.updateTableOrders(socket, function(orders) {
                order.isNewOrder(orders, function(newOrder) {
                    callback(newOrder);
                });
            });
        };

        /**
         * Determine what type of user and table will be updated periodically
         * @type {Function}
         * @param {Object} user current user
         */
        var updateSpecialTables = function(user) {
            admin.isTypeAccount(user, function(isDriver, isAdmin) {
                if (!isAdmin) {
                    socket.emit('orders:isDriver', {
                        isDriver: isDriver
                    }, function(callback) {
                        log.info('updateTableOrders:'.yellow + ' ' + callback);
                    });
                    if (isDriver) {
                        socket.$emit('drivers:assigned', function(callback) {});
                    }
                } else {
                    socket.emit('admin:isAdmin', {
                        isAdmin: isAdmin
                    }, function(callback) {
                        log.info('updateTableOrders:'.yellow + ' ' + callback);
                    });
                    socket.$emit('admin:data', function(callback) {});
                }
            });
        };

        /**
         * Remove the order (not used yet)
         *@event module:Socket#orders:delete
         */
        socket.on('orders:delete', function(callback) {});

        console.log('Connect with ID: ' + socket.id);
        socket.emit('sendid', { id: socket.id });

        /**
         * Gap socket connection
         *@event module:Socket#disconnect
         */
        socket.on('disconnect', function() {
            console.log('Disconnect with ID: ' + socket.id);
        });
    });

    /**
     * Server launch event timers for the update panels. Call occurs
     * in controllers (modules), respectively event name
     *@event module:Socket#login
     * @see {@link module:Login}
     */
    server.addListener('login', function(user) {
        admin.startTimers(user);
        driver.startTimers(user);
    });

    /**
     * Server stop event timers update panels. Call occurs
     * in controllers (modules), respectively event name
     *@event module:Socket#logout
     * @see {@link module:Logout}
     */
    server.addListener('logout', function(user) {
        admin.stopTimers(user);
        driver.stopTimers(user);
    });

    return io;
};
