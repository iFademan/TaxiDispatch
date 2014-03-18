/**
 * Module error until an unused ...
 *@module SendHttpError
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function(req, res, next) {
    res.sendHttpError = function(error) {
        res.status(error.status);
        if (res.req.headers['x-requested-with'] == 'XMLHttpRequest') {
            res.json(error);
        } else {
            res.render('error', {error: error});
        }
    };
    next();
};
