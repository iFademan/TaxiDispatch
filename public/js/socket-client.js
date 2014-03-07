'use strict';

var newOrder = null;
var oldOrders = null;
var isDriver = null;
var isAdmin = null;
var assignedOrders = null;

/**
 * Сокет на клиентской части
 *@example
 * var socket = io.connect('', {
 *    reconnect: false
 * });
 */
var socket = io.connect('', {
    reconnect: false
});

/**
 * Отправка запросов и получение данных от сервера на клиентской части
 *@module SocketClient
 */
$(function() {
    var btnApplyOrder = $('#btnApplyOrder');
    var btnCreateOrder = $('#btnCreateOrder');
    var startField = $('#field-nickname');
    var endField = $('#field-email');

    /**
     * Отправка данных на создание нового ордера, собственно сам клик
     */
    btnCreateOrder.click(function() {
        if (startField.val() && endField.val()) {
            socketOrdersCreate({
                startAddress: startField.val(),
                endAddress: endField.val()
            });
        }
        startField.val('');
        endField.val('');
        startField.focus();
    });

    /**
     * Запуск (обработка) всех ранее созданных заказов
     */
    btnApplyOrder.click(function() {
        socketOrdersApply();
        startField.focus();
    });
});

/**
 * Отправка запроса (на сервер) emit('orders:create'),
 * на создание заказа
 * @type {Function}
 * @param {Object} data передаем серверу из формы "создания заказа"
 * объект следующего типа {startAddress: text, endAddress: text}
 */
var socketOrdersCreate = function(data) {
    console.log('заказ создается...');
    socket.emit('orders:create', data, function(callback) {
        console.log(callback);
        //$('#btnApplyOrder').removeAttr('disabled');
    });
};

/**
 * Отправка запроса (на сервер) emit('orders:update'),
 * на обновление таблиц (таблиц заказов) текущего пользователя, по завершению
 * придет callback
 * @type {Function}
 */
var socketOrdersUpdate = function() {
    console.log('заказы обновляются...');
    socket.emit('orders:update', function(callback) {
        console.log(callback);
    });
};

/**
 * Отправка запроса (на сервер) emit('orders:apply'),
 * на запуск обработки очереди заказов
 * @type {Function}
 */
var socketOrdersApply = function() {
    console.log('обрабатываем заказы...');
    //disableAllFields();
    socket.emit('orders:apply', function(callback) {
        console.log(callback);
    });
};

/**
 * Отправка запроса (на сервер) emit('orders:delete'),
 * на удаление заказа (ордера)
 * @type {Function}
 */
var socketOrdersDelete = function() {
    console.log('заказ удаляется...');
    socket.emit('orders:delete', function(callback) {
        console.log(callback);
    });
};

/**
 * Отправка запроса (на сервер) emit('drivers:assigned'),
 * для получения заказов назначенных водителю
 * @type {Function}
 */
var socketGetAssignedOrders = function() {
    console.log('получаем назначенные водителю заказы...');
    socket.emit('drivers:assigned', function(callback) {
        console.log(callback);
    });
};

/**
 * Получаем с сервера данные, таблицы новых и старых ордеров, обновляем их
 * на клиенте
 * @param {Object} data данные с сервера, таблицы в html виде
 * @param {Function} callback отправляем серверу в качестве подтверждения
 * полученных данных
 *@event module:SocketClient#orders:get
 */
socket.on('orders:get', function(data, callback) {
    newOrder = data.newOrder;
    oldOrders = data.oldOrders;
    $(function() {
        refreshOldOrderTable(oldOrders);
        refreshNewOrderTable(newOrder);
    });
    callback('клиент данные для обновления таблиц New/Old Orders получил!');
});

/**
 * Получаем с сервера данные о типе аккаунта, устанавливаем заголовок
 * водительской панели, вставляем шапку таблицы для ордеров назначенных водителю
 * @param {Object} data данные с сервера о типе клиента, в данном случае
 * водителе
 * @param {Function} callback отправляем серверу в качестве подтверждения
 * полученных данных
 *@event module:SocketClient#orders:isDriver
 */
socket.on('orders:isDriver', function(data, callback) {
    isDriver = data.isDriver;
    $(function() {
        setTitlePanel(isDriver, isAdmin);
        setHeaderDriverTable(isDriver);
    });
    callback('isDriver доставлен клиенту');
    console.log('User isDriver: ' + JSON.stringify(data));
});

/**
 * Получаем данные с сервера о таблице назначенных водителю ордеров и обновляем
 * таблицу на клиенте
 * @param {Object} data данные с сервера, таблица ордеров назначенных водителю
 * @param {Function} callback отправляем серверу в качестве подтверждения
 * полученных данных
 *@event module:SocketClient#drivers:getAssigned
 */
socket.on('drivers:getAssigned', function(data, callback) {
    assignedOrders = data.assignedOrders;
    $(function() {
        refreshAssignedOrderTable(assignedOrders);
    });
    callback('клиент данные для обновления таблицы Assigned Orders получил!');
    //console.log('Assigned Orders: ' + JSON.stringify(data));
});

/**
 * Получаем с сервера данные о типе аккаунта и устанавливаем заголовок
 * админской панели
 * @param {Boolean} data данные с сервера о типе клиента, в данном случае админе
 * @param {Function} callback отправляем серверу в качестве подтверждения
 * полученных данных
 *@event module:SocketClient#admin:isAdmin
 */
socket.on('admin:isAdmin', function(data, callback) {
    isAdmin = data.isAdmin;
    $(function() {
        setTitlePanel(isDriver, isAdmin);
    });
    callback('isAdmin доставлен клиенту');
    //console.log('isAdmin: ' + JSON.stringify(data));
});

/**
 * Получаем данные для админской панели с сервера, таблицу свободных водителей,
 * таблицу невыполненных заказов и таблицу клиентов
 * @param {Object} data данные с сервера
 * @param {Function} callback отправляем серверу в качестве подтверждения
 * получения данных
 *@event module:SocketClient#admin:send
 */
socket.on('admin:send', function(data, callback) {
    var listFreeDrivers = data.listFreeDrivers;
    var listAllNewOrders = data.listAllNewOrders;
    var listOfClients = data.listOfClients;
    $(function() {
        refreshAdminListFreeDriverTable(listFreeDrivers);
        refreshAdminListOutstandOrdersTable(listAllNewOrders);
        refreshAdminListOfClientsTable(listOfClients);
    });
    callback('клиент данные для обновления таблиц Admin Panel получил!');
    //console.log('isAdmin: ' + JSON.stringify(data));
});

/**
 * После подключения вызываем событие emit('orders:update') и получаем
 * таблицы с новыми и старыми ордерами (заказами), а так же событие
 * emit('drivers:assigned') и получаем назначенные водителю заказы
 *@event module:SocketClient#connect
 */
socket.on('connect', function() {
    console.log('connected!');
    socketOrdersUpdate();
    socketGetAssignedOrders();
});

/**
 * Осуществляем переподключение при разрыве соединения
 * вызовом внутреннего события $emit('error')
 *@event module:SocketClient#disconnect
 */
socket.on('disconnect', function() {
    console.log('connection lost');
    this.$emit('error');
});

/**
 * Получение socketID с сервера (просто проверка)
 * @param {Object} data id сокета
 *@event module:SocketClient#sendid
 */
socket.on('sendid', function(data) {
    console.log('Your socket ID is: ' + data.id);
});

/**
 * Осуществляем переподключение при ошибке или разрыве соединения по таймеру
 *@event module:SocketClient#error
 */
socket.on('error', function() {
    setTimeout(function() {
        socket.socket.connect();
    }, 500);
});

/**
 * Обновляем таблицу новых ордеров (на клиентском/водительском аккаунте)
 * @type {Function}
 * @param {String} html получаем с сервера готовую html-таблицу с данными
 */
var refreshNewOrderTable = function(html) {
    $('table#newOrder tbody').remove();
    $('table#newOrder').append(html);
};

/**
 * Обновляем таблицу старых ордеров (на клиентском/водительском аккаунте)
 * @type {Function}
 * @param {String} html получаем с сервера готовую html-таблицу с данными
 */
var refreshOldOrderTable = function(html) {
    $('table#oldOrder tbody').remove();
    $('table#oldOrder').append(html);
};

/**
 * Обновляем таблицу ордеров назначенных водителя на водительском аккаунте
 * @type {Function}
 * @param {String} html получаем с сервера готовую html-таблицу с данными
 */
var refreshAssignedOrderTable = function(html) {
    $('table#assignedOrder tbody').remove();
    $('table#assignedOrder').append(html);
};

/**
 * Обновляем таблицу свободных водителей на админском аккаунте
 * @type {Function}
 * @param {String} html получаем с сервера готовую html-таблицу с данными
 */
var refreshAdminListFreeDriverTable = function(html) {
    $('table#listFreeDrivers tbody').remove();
    $('table#listFreeDrivers').append(html);
};

/**
 * Обновляем таблицу невыполненных заказов на админском аккаунте
 * @type {Function}
 * @param {String} html получаем с сервера готовую html-таблицу с данными
 */
var refreshAdminListOutstandOrdersTable = function(html) {
    $('table#listOutstandOrders tbody').remove();
    $('table#listOutstandOrders').append(html);
};

/**
 * Обновляем таблицу клиентов на админском аккаунте
 * @type {Function}
 * @param {String} html получаем с сервера готовую html-таблицу с данными
 */
var refreshAdminListOfClientsTable = function(html) {
    $('table#listOfClients tbody').remove();
    $('table#listOfClients').append(html);
};

/**
 * Устанавливаем заголовок панели
 * @type {Function}
 * @param {Boolean} isDriver проверка на водителя
 * @param {Boolean} isAdmin проверка на админа
 */
var setTitlePanel = function(isDriver, isAdmin) {
    var titlePanel = $('h2.center');
    titlePanel.empty();
    if (!isAdmin) {
        if (isDriver) {
            titlePanel.append('Driver Account');
        } else {
            titlePanel.append('Client Account');
        }
    } else {
        titlePanel.append('Admin Panel');
    }
};

/**
 * Добавляем шапку таблицы для водителя
 * @type {Function}
 * @param {Boolean} isDriver дополнительная проверочка на водителя
 */
var setHeaderDriverTable = function(isDriver) {
    if (isDriver) {
        var html = '';
        html += '<div id="assignedOrderDiv">';
        html += '<h4 class="center">Assigned orders</h4>';
        html += '<table id="assignedOrder" class="table table-hover">';
        html += '<thead><tr>';
        html += '<th>Start address</th>';
        html += '<th>Destination address</th>';
        html += '<th>Status</th>';
        html += '</tr></thead>';
        html += '<tbody><tr>';
        html += '<td colspan="3" class="text-center">';
        html += '- empty or update with 10 second delay -' + '</td>';
        html += '</tr></tbody>';
        html += '</table>';
        html += '<br>';
        html += '</div>';

        $('#assignedOrderDiv').remove();
        $('.col-md-8').prepend(html);
    }
};

/**
 * Делаем неактивными все поля формы "отправки заказа"
 * @type {Function}
 */
var disableAllFields = function() {
    $('#btnApplyOrder').attr('disabled');
    $('#btnCreateOrder').attr('disabled');
    $('#field-nickname').attr('disabled');
    $('#field-email').attr('disabled');
};

/**
 * Делаем активными все поля формы "отправки заказа"
 * @type {Function}
 */
var enableAllFields = function() {
    $('#btnApplyOrder').removeAttr('disabled');
    $('#btnCreateOrder').removeAttr('disabled');
    $('#field-nickname').removeAttr('disabled');
    $('#field-email').attr('disabled');
};
