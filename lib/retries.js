
/**
 * Retriable.
 *
 * @api private
 */

module.exports = [
  nonHttp,
  httpServer,
  httpClient
]

/**
 * Retry non HTTP errors.
 *
 * @param {String|Number} err.code
 * @return {Boolean}
 * @api private
 */
function nonHttp (err) {
  return !err.status
}

/**
 * Retry common http status codes that are a result
 * of server issues.
 *
 * @param {String|Number} err.code
 * @return {Boolean}
 * @api private
 */

function httpServer (err) {
  return err.status == 500 ||
    err.status == 502 ||
    err.status == 503 ||
    err.status == 504
}

/**
 * Retry common http status codes that are a result
 * of client issues such as rate limits.
 *
 * @param {String|Number} err.code
 * @return {Boolean}
 * @api private
 */

function httpClient (err) {
  return err.status == 429
}
