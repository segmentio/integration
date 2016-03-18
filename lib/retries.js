
/**
 * Retriable.
 *
 * @api private
 */

module.exports = [
  status,
  network,
  locked
];

/**
 * Retry common status err.codes that are a result
 * of server issues or rate limits. Way too hard
 * to catch everything here, but these catch most.
 *
 * @param {String|Number} err.code
 * @return {Boolean}
 * @api private
 */

function status(err){
  return err.status == 500
    || err.status == 502
    || err.status == 503
    || err.status == 504
    || err.status == 429;
}

/**
 * Retry common network issues.
 *
 * @param {String} err.code
 * @return {Boolean}
 * @api private
 */

function network(err){
  return err.code == 'ECONNRESET'
    || err.code == 'ECONNREFUSED'
    || err.code == 'ECONNABORTED'
    || err.code == 'ETIMEDOUT'
    || err.code == 'EADDRINFO'
    || err.code == 'EHOSTUNREACH'
    || err.code == 'ENOTFOUND';
}

/**
 * Resource locks.
 *
 * @param {Error} err
 * @return {Boolean}
 * @api private
 */

function locked(err){
  return err.code == 'RESOURCE_LOCKED';
}