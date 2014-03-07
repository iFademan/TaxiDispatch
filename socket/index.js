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
 * Основной событийный цикл
 *@module Socket
 * @param {EventEmitter} server
 * @return {Object} io объект socket.io
 */
module.exports = function(server) {

    var order = new Order();
    var admin = new Admin();
    var driver = new Driver();
    var status = new Status();

    /**
     * Сокет на серверной части
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
     * После присоединения подписываемся на остальные события,
     * получаем пользователя и т.д.
     *@event module:Socket#connection
     */
    io.sockets.on('connection', function(socket) {
        var user = socket.handshake.user;

        /**
         * Создаем заказ
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
                 * Генерим внутренний вызов события на обновление заказов
                 */
                socket.$emit('orders:update', callback);
            });
        });

        /**
         * Обновляем заказы и заголовок панели
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
         * Получаем данные для админской панели
         *@event module:Socket#admin:data
         */
        socket.on('admin:data', function(callback) {
            admin.updateAdminTables(socket, function() {});
        });

        /**
         * Получаем заказы назначенные на водителя
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
         * Запускаем заказы в обработку
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
         * Последовательная смена статуса у заказа (в дальнейшем смену статуса
         * можно вынести на кнопки в водительском аккаунте, так чтоб водитель
         * мог сам менять свой статус по факту). Сейчас сделана автоматическая
         * смена статуса для наглядного показа функционала
         * @param {Object} args args.socket наш сокет, args.order новый ордер
         * @param {Function} socketCallback callback для клиента
         * об успешной доставке (это для отладки)
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
                log.info(('SocketEvent:').blue + 'заказ выполнен!');
                socketCallback('заказ выполнен!');

                /**
                 * когда заказ выполнен и водитель освобожден, делаем внутренний
                 * вызов события orders:apply для следующего заказа
                 */
                order.setFreeDriver(args.order, function(driver) {
                    socket.$emit('orders:apply', socketCallback);
                });
            });
        };

        /**
         * Получаем первый новый заказ (один)
         * @type {Function}
         * @param {Function} callback возвращаем новый заказ
         */
        var getNewOrder = function(callback) {
            order.updateTableOrders(socket, function(orders) {
                order.isNewOrder(orders, function(newOrder) {
                    callback(newOrder);
                });
            });
        };

        /**
         * Определяем тип пользователя и какие таблицы
         * будем периодически обнолять
         * @type {Function}
         * @param {Object} user текущий пользователь
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
         * Удаляем заказ, пока не используется, все заказы сохраняются
         *@event module:Socket#orders:delete
         */
        socket.on('orders:delete', function(callback) {});

        console.log('Connect with ID: ' + socket.id);
        socket.emit('sendid', { id: socket.id });

        /**
         * Разрыв сокетного соединения
         *@event module:Socket#disconnect
         */
        socket.on('disconnect', function() {
            console.log('Disconnect with ID: ' + socket.id);
        });
    });

    /**
     * Серверное событие запуска таймеров для обновления панелей.
     * Вызов происходит в контроллерах (модулях) соответственно названию события
     *@event module:Socket#login
     * @see {@link module:Login}
     */
    server.addListener('login', function(user) {
        admin.startTimers(user);
        driver.startTimers(user);
    });

    /**
     * Серверное событие остановки таймеров обновления панелей
     * Вызов происходит в контроллерах (модулях) соответственно названию события
     *@event module:Socket#logout
     * @see {@link module:Logout}
     */
    server.addListener('logout', function(user) {
        admin.stopTimers(user);
        driver.stopTimers(user);
    });

    return io;
};
