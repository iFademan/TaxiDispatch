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

module.exports = function(server) {

    var order = new Order();
    var admin = new Admin();
    var driver = new Driver();
    var status = new Status();

    // ------ Настройки сокета и аутентификация -------------

    var io = require('socket.io').listen(server);

    io.set('origins', 'localhost:*');
    io.set('logger', log);
    io.set('transports', [
        'websocket',
        'xhr-polling',
        'jsonp-polling'
    ]);

    require('./auth')(io);

    // ------------------ События сокета --------------------

    io.sockets.on('connection', function(socket) {
        var user = socket.handshake.user;

        // Создаем заказ
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
                // Генерим внутренний вызов события на обновление заказов
                socket.$emit('orders:update', callback);
            });
        });

        // Обновляем заказы и заголовок панели
        socket.on('orders:update', function(callback) {
            order.updateTableOrders(socket, function(orders) {
                callback('orders updated!');
                log.info(('SocketEvent:Update ').blue + 'orders updated!');
            });

            updateSpecialTables(user);
        });

        // получаем данные для админской панели
        socket.on('admin:data', function(callback) {
            admin.updateAdminTables(socket, function() {});
        });

        // получаем заказы назначенные на водителя
        socket.on('drivers:assigned', function(socketCallBack) {
            driver.findAssignedOrders(user, function(assignedOrders) {
                socket.emit('drivers:getassigned', {
                    assignedOrders: order.sendTableOrders(assignedOrders)
                }, function(callback) {
                    socketCallBack('orders driver ' + user.login + ' update!');
                    log.info(('SocketEvent:Update ').blue + callback);
                });
            });
        });

        // Запускаем заказы в обработку
        socket.on('orders:apply', function(socketCallback) {
            getNewOrder(function(newOrder) {
                var args = {
                    socket: socket,
                    order: newOrder
                };
                actions(args, socketCallback);
            });
        });

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
                log.info(('SocketEvent:').blue + 'заказ выполнен!');
                socketCallback('заказ выполнен!');

                order.setFreeDriver(args.order, function(driver) {
                    socket.$emit('orders:apply', socketCallback);
                });
            });
        };

        var getNewOrder = function(callback) {
            order.updateTableOrders(socket, function(orders) {
                order.isNewOrder(orders, function(newOrder) {
                    callback(newOrder);
                });
            });
        };

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

        // Удаляем заказ
        socket.on('orders:delete', function(callback) {});

        console.log('Connect with ID: ' + socket.id);
        socket.emit('sendid', { id: socket.id });

        socket.on('disconnect', function() {
            console.log('Disconnect with ID: ' + socket.id);
        });
    });

    // таймера обновления панелей
    server.addListener('login', function(user) {
        admin.startTimers(user);
        driver.startTimers(user);
    });

    server.addListener('logout', function(user) {
        admin.stopTimers(user);
        driver.stopTimers(user);
    });

    return io;
};
