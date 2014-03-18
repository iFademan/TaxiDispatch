'use strict';

/**
 * Leave, clean cookies, the server will send an event emit('logout'),
 * which stops the operation of timers, if they are provided for the user,
 * redirect the user to the main page
 *@module {Middleware} Logout
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @see {@link module:Socket}
 *@example
 * server.addListener('logout', function(user) {
 *      admin.stopTimers(user);
 *      driver.stopTimers(user);
 * });
 */
module.exports = function(req, res, next) {
    var server = req.app.get('server');

    server.emit('logout', req.user);

    req.logout();
    res.redirect('/');
};
