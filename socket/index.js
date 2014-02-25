'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var OrderModel = mongoose.model('order');
var Order = require('./order');
var Driver = require('./driver');
var Admin = require('./admin');


module.exports = function(server) {

    // ------------------ Настройки сокета и аутентификация --------------------

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
                status: config.get("status:queue:key"),
                new: true
            };

            var order = new OrderModel(simpleOrder);

            order.save(function(err) {
                if (err) throw err;
                // Генерим внутренний вызов события на обновление заказов
                socket.$emit('orders:update', callback);
            });

            callback('заказ создан!');
            log.info(('SocketEvent:Create ').blue + 'заказ создан!');
        });

        // Обновляем заказы и заголовок панели
        socket.on('orders:update', function(callback) {
            Order.updateTableOrders(socket, function(orders){
                callback('заказы обновлены!');
                log.info(('SocketEvent:Update ').blue + 'заказы обновлены!');
            });

            Order.isTypeAccount(user, function(isDriver, isAdmin) {
                if (!isAdmin) {
                    socket.emit('orders:isDriver', {
                        isDriver: isDriver
                    }, function(callback) {
                        log.info(('updateTableOrders:').yellow + " " + callback);
                    });
                    if (isDriver) {
                        socket.$emit('drivers:assigned', function(callback) {});
                    }
                } else {
                    socket.emit('admin:isAdmin', {
                       isAdmin: isAdmin
                    }, function(callback) {
                        log.info(('updateTableOrders:').yellow + " " + callback);
                    });
                    socket.$emit('admin:data', function(callback) {});
                }
            });
        });

        // получаем данные для админской панели
        socket.on('admin:data', function(callback) {
            Admin.updateAdminTables(socket, function() {});
        });

        // получаем заказы назначенные на водителя
        socket.on('drivers:assigned', function(socketCallBack) {
            Driver.searchAssignedOrders(user, function(assignedOrders) {
                socket.emit('drivers:getassigned', {
                    assignedOrders: Order.sendTableOrders(assignedOrders)
                }, function(callback) {
                    socketCallBack('заказы на водителя ' + user.login + ' обновлены!');
                    log.info(('SocketEvent:Update ').blue + callback);
                });
            });
        });

        // Запускаем заказы в обработку
        socket.on('orders:apply', function(socketCallback) {
            Order.updateTableOrders(socket, function(orders) {
                Order.isNewOrder(orders, function(order) {
                    async.series([
                        function(callback) { Order.changeStatusOrder(order, 1, socket, config.get('status:search:key'), callback); },
                        function(callback) { Order.setFreeDriverOnOrder(order, 5, callback); },
                        function(callback) { Order.changeStatusOrder(order, 10, socket, config.get('status:found:key'), callback); },
                        function(callback) { Order.changeStatusOrder(order, 5, socket, config.get('status:going:key'), callback); },
                        function(callback) { Order.changeStatusOrder(order, 10, socket, config.get('status:place:key'), callback); },
                        function(callback) { Order.changeStatusOrder(order, 10, socket, config.get('status:waiting:key'), callback); },
                        function(callback) { Order.changeStatusOrder(order, 5, socket, config.get('status:passenger:key'), callback); },
                        function(callback) { Order.changeStatusOrder(order, 10, socket, config.get('status:close:key'), callback); }
                    ], function(err) {
                        if (err) throw err;
                        log.info(('SocketEvent:').blue + 'заказ выполнен!');
                        socketCallback('заказ выполнен!');
                        Order.setFreeDriver(order, function(driver) {
                            socket.$emit('orders:apply', socketCallback);
                        });
                    });
                });
            });
        });

        // Удаляем заказ
        socket.on('orders:delete', function(callback) {});

        console.log('Connect with ID: ' + socket.id);
        socket.emit('sendid', { id: socket.id });

        socket.on('disconnect', function () {
            console.log('Disconnect with ID: ' + socket.id);
        });
    });

    return io;
};