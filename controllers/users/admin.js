'use strict';

module.exports = function(req, res, next) {
    res.render('admin', {
        title: 'Admin'
    });
};
