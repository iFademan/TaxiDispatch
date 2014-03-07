'use strict';

/**
 * Выходим, чистим куки, отправляем серверу событие emit('logout'), в котором
 * останавливаем работу таймеров, если они предусмотрены для данного
 * пользователя, перенаправляем пользователя на главную страницу
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
