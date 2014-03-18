/**
 * After receiving the user pass a reference to it for the views,
 * through the locals
 *@module UserHelper
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function(req, res, next) {
  res.locals.user = req.user;
  next();
};
