'use strict';

module.exports = function(req, res, next) {
    res.render('order', {
        title: 'Order'
    });
};