'use strict';

var newOrder = null;
var oldOrders = null;
var isDriver = null;
var isAdmin = null;
var assignedOrders = null;

var socket = io.connect('', {
    reconnect: false
});

$(function() {
    var btnApplyOrder = $('#btnApplyOrder');
    var btnCreateOrder = $('#btnCreateOrder');
    var startField = $('#field-nickname');
    var endField = $('#field-email');

    // отправка данных на создание нового ордера
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

    // Вызов (обработка) всех ранее созданных заказов
    btnApplyOrder.click(function() {
        socketOrdersApply();
        startField.focus();
    });
});

// ---------- sockets functions ---------- \\

var socketOrdersCreate = function(data) {
    console.log('заказ создается...');
    socket.emit('orders:create', data, function(callback) {
        console.log(callback);
        //$('#btnApplyOrder').removeAttr('disabled');
    });
};

var socketOrdersUpdate = function() {
    console.log('заказы обновляются...');
    socket.emit('orders:update', function(callback) {
        console.log(callback);
    });
};

var socketOrdersApply = function() {
    console.log('обрабатываем заказы...');
    //disableAllFields();
    socket.emit('orders:apply', function(callback) {
        console.log(callback);
    });
};

var socketOrdersDelete = function() {
    console.log('заказ удаляется...');
    socket.emit('orders:delete', function(callback) {
        console.log(callback);
    });
};

var socketGetAssignedOrders = function() {
    console.log('получаем назначенные водителю заказы...');
    socket.emit('drivers:assigned', function(callback) {
        console.log(callback);
    });
};

socket.on('orders:get', function(data, callback) {
    newOrder = data.newOrder;
    oldOrders = data.oldOrders;
    $(function() {
        refreshOldOrderTable(oldOrders);
        refreshNewOrderTable(newOrder);
    });
    callback('клиент данные для обновления таблиц New/Old Orders получил!');
});

socket.on('orders:isDriver', function(data, callback) {
    isDriver = data.isDriver;
    $(function() {
        setTitlePanel(isDriver, isAdmin);
        setHeaderDriverTable(isDriver);
    });
    callback('isDriver доставлен клиенту');
    console.log('User isDriver: ' + JSON.stringify(data));
});

socket.on('drivers:getassigned', function(data, callback) {
    assignedOrders = data.assignedOrders;
    $(function() {
        refreshAssignedOrderTable(assignedOrders);
    });
    callback('клиент данные для обновления таблицы Assigned Orders получил!');
    //console.log('Assigned Orders: ' + JSON.stringify(data));
});

socket.on('admin:isAdmin', function(data, callback) {
    isAdmin = data.isAdmin;
    $(function() {
        setTitlePanel(isDriver, isAdmin);
    });
    callback('isAdmin доставлен клиенту');
    //console.log('isAdmin: ' + JSON.stringify(data));
});

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

socket.on('connect', function() {
    console.log('connected!');
    socketOrdersUpdate();
    socketGetAssignedOrders();
});

socket.on('disconnect', function() {
    console.log('connection lost');
    this.$emit('error');
});

socket.on('sendid', function(data) {
    console.log('Your socket ID is: ' + data.id);
});

socket.on('error', function() {
    setTimeout(function() {
        socket.socket.connect();
    }, 500);
});


// ---------- interface functions ---------- \\

var refreshNewOrderTable = function(html) {
    $('table#newOrder tbody').remove();
    $('table#newOrder').append(html);
};

var refreshOldOrderTable = function(html) {
    $('table#oldOrder tbody').remove();
    $('table#oldOrder').append(html);
};

var refreshAssignedOrderTable = function(html) {
    $('table#assignedOrder tbody').remove();
    $('table#assignedOrder').append(html);
};

var refreshAdminListFreeDriverTable = function(html) {
    $('table#listFreeDrivers tbody').remove();
    $('table#listFreeDrivers').append(html);
};

var refreshAdminListOutstandOrdersTable = function(html) {
    $('table#listOutstandOrders tbody').remove();
    $('table#listOutstandOrders').append(html);
};

var refreshAdminListOfClientsTable = function(html) {
    $('table#listOfClients tbody').remove();
    $('table#listOfClients').append(html);
};

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

// Добавляем шапку таблицы для водителя
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

var disableAllFields = function() {
    $('#btnApplyOrder').attr('disabled');
    $('#btnCreateOrder').attr('disabled');
    $('#field-nickname').attr('disabled');
    $('#field-email').attr('disabled');
};

var enableAllFields = function() {
    $('#btnApplyOrder').removeAttr('disabled');
    $('#btnCreateOrder').removeAttr('disabled');
    $('#field-nickname').removeAttr('disabled');
    $('#field-email').attr('disabled');
};
