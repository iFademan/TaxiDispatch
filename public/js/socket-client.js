'use strict';

var newOrder = null;
var oldOrders = null;
var isDriver = null;
var isAdmin = null;
var assignedOrders = null;

/**
 * Socket on the client side
 *@example
 * var socket = io.connect('', {
 *    reconnect: false
 * });
 */
var socket = io.connect('', {
    reconnect: false
});

/**
 * Sending requests and receiving data from the server to the client side
 *@module SocketClient
 */
$(function() {
    var btnApplyOrder = $('#btnApplyOrder');
    var btnCreateOrder = $('#btnCreateOrder');
    var startField = $('#field-nickname');
    var endField = $('#field-email');

    /**
     * Sending data to create a new order, click
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
     * Running (processing) of all previously created orders
     */
    btnApplyOrder.click(function() {
        socketOrdersApply();
        startField.focus();
    });
});

/**
 * Sending a request (the server) emit('orders: create'), to create order
 * @type {Function}
 * @param {Object} data Passed to the server from a form of "create order"
 * object of type {startAddress: text, endAddress: text}
 */
var socketOrdersCreate = function(data) {
    console.log('The order a now is created...');
    socket.emit('orders:create', data, function(callback) {
        console.log(callback);
        //$('#btnApplyOrder').removeAttr('disabled');
    });
};

/**
 * Sending a request (the server) emit('orders: update'), to update
 * the tables (tables of orders) of the current user, the completion
 * callback will
 * @type {Function}
 */
var socketOrdersUpdate = function() {
    console.log('orders is updated...');
    socket.emit('orders:update', function(callback) {
        console.log(callback);
    });
};

/**
 * Sending a request (the server) emit('orders: apply'), to start
 * the queue processing orders
 * @type {Function}
 */
var socketOrdersApply = function() {
    console.log('process orders...');
    //disableAllFields();
    socket.emit('orders:apply', function(callback) {
        console.log(callback);
    });
};

/**
 * Sending a request (the server) emit('orders: delete'),
 * to delete the order
 * @type {Function}
 */
var socketOrdersDelete = function() {
    console.log('order is removed...');
    socket.emit('orders:delete', function(callback) {
        console.log(callback);
    });
};

/**
 * Sending a request (the server) emit('drivers: assigned'),
 * to obtain orders designated driver
 * @type {Function}
 */
var socketGetAssignedOrders = function() {
    console.log('get orders designated driver...');
    socket.emit('drivers:assigned', function(callback) {
        console.log(callback);
    });
};

/**
 * Obtain data from the server, the table of new and old orders,
 * updating them on the client
 * @param {Object} data Data from the server table in html form
 * @param {Function} callback Send to the server as the data confirm
 *@event module:SocketClient#orders:get
 */
socket.on('orders:get', function(data, callback) {
    newOrder = data.newOrder;
    oldOrders = data.oldOrders;
    $(function() {
        refreshOldOrderTable(oldOrders);
        refreshNewOrderTable(newOrder);
    });
    callback('Client. Data for updating tables New / Old Orders received!');
});

/**
 * Obtain data from the server type account, set the title of the panel driver,
 * insert the table header for orders designated driver
 * @param {Object} data Data from a server on the client type,
 * in this case the driver
 * водителе
 * @param {Function} callback Send to the server as the data confirm
 *@event module:SocketClient#orders:isDriver
 */
socket.on('orders:isDriver', function(data, callback) {
    isDriver = data.isDriver;
    $(function() {
        setTitlePanel(isDriver, isAdmin);
        setHeaderDriverTable(isDriver);
    });
    callback('isDriver delivered to client');
    console.log('User isDriver: ' + JSON.stringify(data));
});

/**
 * Obtain data from a server on the table designated driver orders and
 * update the table on the client
 * @param {Object} data Data from the server, the table orders designated driver
 * @param {Function} callback Send to the server as the data confirm
 *@event module:SocketClient#drivers:getAssigned
 */
socket.on('drivers:getAssigned', function(data, callback) {
    assignedOrders = data.assignedOrders;
    $(function() {
        refreshAssignedOrderTable(assignedOrders);
    });
    callback('Client. Data to update the table Assigned Orders received!');
    //console.log('Assigned Orders: ' + JSON.stringify(data));
});

/**
 * Obtain data from the server type account and set the caption panel admins
 * @param {Boolean} data Data from a server on the client type,
 * in this case admin
 * @param {Function} callback Send to the server as the data confirm
 *@event module:SocketClient#admin:isAdmin
 */
socket.on('admin:isAdmin', function(data, callback) {
    isAdmin = data.isAdmin;
    $(function() {
        setTitlePanel(isDriver, isAdmin);
    });
    callback('isAdmin delivered to client');
    //console.log('isAdmin: ' + JSON.stringify(data));
});

/**
 * Obtain data from the server admin's panel, table-free drivers, the table
 * is not completed orders and clients table
 * @param {Object} data Data from server
 * @param {Function} callback Send to the server as the data confirm
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
    callback('Client. Data for updating tables Admin Panel received!');
    //console.log('isAdmin: ' + JSON.stringify(data));
});

/**
 * After connecting the call event emit('orders: update') and obtain a table
 * with old and new orders and get a designated driver orders trigger events
 * emit('drivers: assigned')
 *@event module:SocketClient#connect
 */
socket.on('connect', function() {
    console.log('connected!');
    socketOrdersUpdate();
    socketGetAssignedOrders();
});

/**
 * Reconnection after disconnection. Call the internal event $emit('error')
 *@event module:SocketClient#disconnect
 */
socket.on('disconnect', function() {
    console.log('connection lost');
    this.$emit('error');
});

/**
 * Getting socketID server (just checking)
 * @param {Object} data Socket ID
 *@event module:SocketClient#sendid
 */
socket.on('sendid', function(data) {
    console.log('Your socket ID is: ' + data.id);
});

/**
 * Reconnection in case of error or disconnection
 *@event module:SocketClient#error
 */
socket.on('error', function() {
    setTimeout(function() {
        socket.socket.connect();
    }, 500);
});

/**
 * Update the table of new orders (on the client/driver account)
 * @type {Function}
 * @param {String} html Obtain from the server finished html-table with data
 */
var refreshNewOrderTable = function(html) {
    $('table#newOrder tbody').remove();
    $('table#newOrder').append(html);
};

/**
 * Update the table of old orders (on the client/driver account)
 * @type {Function}
 * @param {String} html Obtain from the server finished html-table with data
 */
var refreshOldOrderTable = function(html) {
    $('table#oldOrder tbody').remove();
    $('table#oldOrder').append(html);
};

/**
 * Update the table of orders designated driver in the driver's account
 * @type {Function}
 * @param {String} html Obtain from the server finished html-table with data
 */
var refreshAssignedOrderTable = function(html) {
    $('table#assignedOrder tbody').remove();
    $('table#assignedOrder').append(html);
};

/**
 * Update the table of free drivers on the admin account
 * @type {Function}
 * @param {String} html Obtain from the server finished html-table with data
 */
var refreshAdminListFreeDriverTable = function(html) {
    $('table#listFreeDrivers tbody').remove();
    $('table#listFreeDrivers').append(html);
};

/**
 * Updating table not executed orders on the admin account
 * @type {Function}
 * @param {String} html Obtain from the server finished html-table with data
 */
var refreshAdminListOutstandOrdersTable = function(html) {
    $('table#listOutstandOrders tbody').remove();
    $('table#listOutstandOrders').append(html);
};

/**
 * Update the clients table for the admin account
 * @type {Function}
 * @param {String} html Obtain from the server finished html-table with data
 */
var refreshAdminListOfClientsTable = function(html) {
    $('table#listOfClients tbody').remove();
    $('table#listOfClients').append(html);
};

/**
 * Set the title panel
 * @type {Function}
 * @param {Boolean} isDriver Check on the driver
 * @param {Boolean} isAdmin Check on the admin
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
 * Add table header for the driver
 * @type {Function}
 * @param {Boolean} isDriver Additional check on the driver
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
 * Making inactive in all fields "send order"
 * @type {Function}
 */
var disableAllFields = function() {
    $('#btnApplyOrder').attr('disabled');
    $('#btnCreateOrder').attr('disabled');
    $('#field-nickname').attr('disabled');
    $('#field-email').attr('disabled');
};

/**
 * Making active in all fields "send order"
 * @type {Function}
 */
var enableAllFields = function() {
    $('#btnApplyOrder').removeAttr('disabled');
    $('#btnCreateOrder').removeAttr('disabled');
    $('#field-nickname').removeAttr('disabled');
    $('#field-email').attr('disabled');
};
