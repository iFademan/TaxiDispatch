'use strict';

module.exports = function(req, res) {
    var server = req.app.get('server');

    server.emit('logout', req.user);

    req.logout();
    res.redirect('/');
};
