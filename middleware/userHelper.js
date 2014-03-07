/**
 * После получения пользователя передает ссылку
 * для представлений (views) через locals
 *@module UserHelper
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function(req, res, next) {
  res.locals.user = req.user;
  next();
};
