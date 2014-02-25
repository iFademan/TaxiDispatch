'use strict';

var log = require('winston-wrapper')(module);
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var OrderModel = mongoose.model('order');
var UserModel = mongoose.model('user');
var Driver = require('./driver');

// Поиск нового ордера
exports.searchNewOrderById = function(user, callback) {
    OrderModel.find({ user_id: user._id, new: 'true' }, function(err, newOrders) {
        if (err) callback(err, null);
        log.info(('searchNewOrderById:').yellow + ' New order:', JSON.stringify(newOrders));
        callback(null, newOrders);
    });
};

// Все ордера пользователя, кроме новых (необработанных)
exports.searchAllOrdersById = function(user, callback) {
    OrderModel.find({ user_id: user._id, status: config.get('status:close:key') }, function(err, orders) {
        if (err) callback(err, null);
        log.info(('searchAllOrdersById:').yellow + ' Orders:', JSON.stringify(orders));
        callback(null, orders);
    });
};

// Берем первый новый ордер
exports.isNewOrder = function(orders, callback) {
    var newOrder = orders[0];
    if (newOrder[0] != null && newOrder[0] != '' && newOrder.length) {
        callback(newOrder[0]);
    }
};

// Водитель/клиент/админ
exports.isTypeAccount = function(user, callback) {
    UserModel.findOne({ _id: user._id, driver: { $exists: true } }, function(err, driver) {
        if (err) throw err;
        callback(driver != null && driver != '', user.isAdmin)
    });
};

// Смена статуса заказа
exports.changeStatusOrder = function(order, sec, socket, status, callback) {
    var changeOrder;
    log.info(('changeStatusOrder:').yellow + ' меняет статус ' + order.start_address);
    var timer = setInterval(function() {
        status == config.get('status:close:key')
            ? changeOrder = { $set: { status: status, new: 'false' } }
            : changeOrder = { $set: { status: status } };
        order.update(changeOrder, function(err, order) {
            clearInterval(timer);
            if (err) throw err;
            callback(null, order);
            exports.updateTableOrders(socket, function(orders){});
            log.info(('changeStatusOrder:').yellow + ' смена статуса на :', status);
        });
    }, sec * 1000);
};

// Назначение свободного водителя на заказ
exports.setFreeDriverOnOrder = function(order, sec, callback) {
    var freeDriver = { 'driver.order_id': null, driver: { $exists: true } };
    var updateOrderId = { 'driver.order_id': order._id };
    var timer = setInterval(function() {
        UserModel.findOne(freeDriver, function(err, driver) {
            if (err) callback(err);
            log.info(('setFreeDriverOnOrder:').yellow + ' ищу водителя... статус: ' + config.get('status:search:key'));
            if (driver != null && driver != '') {
                clearInterval(timer);
                log.info(('setFreeDriverOnOrder:').yellow + ' нашел водителя... ', JSON.stringify(driver));
                log.info(('setFreeDriverOnOrder:').yellow + ' driver_id: ' + driver._id + ' - order_id ' + order._id);
                UserModel.update({_id: driver._id}, { $set: updateOrderId }, function(err, driver) {
                    if (err) throw err;
                    callback(null, driver);
                    log.info(('setFreeDriverOnOrder:').yellow + ' ордер назначен водителю!');
                });
            }
        });
    }, sec * 1000);
};

// освобождаем водителя от заказа
exports.setFreeDriver = function(order, callback) {
    var findOrderId = { 'driver.order_id': order._id, driver: { $exists: true } };
    var updateOrderId = { 'driver.order_id': null };
    UserModel.update(findOrderId, { $set: updateOrderId }, function(err, driver) {
        if (err) throw err;
        callback(driver);
        log.info(('setFreeDriver:').yellow + ' водитель свободен!');
        console.log('водитель свободен!');
    });
};

// Отпавка сгенерированных таблиц с заказами
exports.sendTableOrders = function(orders) {
    var html = '';
    if (orders != null && orders != '' && orders.length) {
        html += "<tbody>";
        orders.forEach(function(order) {
            html += "<tr>";
            html += "<td>" + order.start_address + "</td>";
            html += "<td>" + order.end_address + "</td>";
            html += "<td><span class='"
            + config.get('status:'+ order.status +':style') + "'>"
            + config.get('status:'+ order.status +':text')
            + "</span></td>";
            html += "</tr>";
        });
        html += "</tbody>";
        log.info(('sendTableOrders:').yellow  + ' html: ' + html.blue);
    } else {
        html = "<tbody><tr><td colspan='3' class='text-center'>" + " - empty - " + "</td></tr></tbody>"
        log.info(('sendTableOrders:').yellow  + ' html: ' + html.blue);
    }
    return html
};

exports.updateTableOrders = function(socket, callback) {
    var user = socket.handshake.user;
    var actions = [
        function(callback) { exports.searchNewOrderById(user, callback) },
        function(callback) { exports.searchAllOrdersById(user, callback) }
    ];

    log.info(('updateTableOrders:').yellow + ' actions: ' + actions);
    async.series(actions, function(err, orders) {
        if (err) throw err;
        var newOrder = orders[0];
        var oldOrders = orders[1];

        log.info(('updateTableOrders:').yellow + ' newOrder: ' + newOrder);
        log.info(('updateTableOrders:').yellow + ' oldOrders: ' + oldOrders);

        socket.emit('orders:get', {
            newOrder: exports.sendTableOrders(newOrder),
            oldOrders: exports.sendTableOrders(oldOrders)
        }, function(callback) {
            log.info(('updateTableOrders:').yellow + " " + callback);
        });

        callback(orders)
    });
};