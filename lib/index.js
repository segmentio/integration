
var debug  = require('debug')('Segmentio:Integration')
  , errors = require('./errors')
  , is     = require('is')
  , util   = require('util');


module.exports = Integration;
module.exports.errors = errors;


function Integration () {
  this.name = 'Integration';
}

/**
 * Base test whether the integration is enabled. Every integration should
 * call this function to see whether the user has explicitly added or removed
 * this integration
 *
 * @param {Facade} message
 * @param {Object} settings
 */

Integration.enabled = function (message, settings) {
  return message.enabled(this.name);
};


/**
 * Identify a user
 * https://segment.io/docs/methods/identify
 *
 * @param {Facade.Identify} identify
 * @param {Object}          settings
 * @param {Function}        callback  (err)
 */

Integration.prototype.identify = function (identify, settings, callback) {
  process.nextTick(callback);
};


/**
 * Track a user
 * https://segment.io/docs/methods/track
 *
 * @param {Facade.Track} track
 * @param {Object}       settings
 * @param {Function}     callback  (err)
 */

Integration.prototype.track = function (track, settings, callback) {
  process.nextTick(callback);
};


/**
 * Alias a user
 * https://segment.io/docs/methods/alias
 *
 * @param {Facade.Alias} alias
 * @param {Object}       settings
 * @param {Function}     callback  (err)
 */

Integration.prototype.alias = function (alias, settings, callback) {
  process.nextTick(callback);
};


/**
 * Common method of handling a response. Filters for bad status codes and
 * turns them into an error.
 *
 * @param {Function} callback  function to call when response is checked
 */

Integration.prototype._handleResponse = function (callback) {
  var self = this;
  return function (err, res, body) {
    if (err) return callback(err);

    var status = res.statusCode;
    if (status === 200 || status === 201) return callback(null, body);

    var message = util.format('Failed %s request: %s', self.name, status);
    debug('%s %s', message, body);
    err = new errors.BadRequest(message, status, body);
    return callback(err);
  };
};


/**
 * Validation method to check whether the key is missing from the settings
 * If the key is missing, a validation error will be returned.
 *
 * @param {Object} settings
 * @param {String} key
 * @param {String} type  (result of 'typeof', e.g. string, number, etc)
 *
 */

Integration.prototype._missingSetting = function (settings, key, type) {
  type = type || 'string';

  if (!is.a(settings[key], type) || is.empty(settings[key])) {
    var msg = util.format('%s integration requires "%s" setting', this.name,
                            key);
    return new errors.Validation(msg);
  }
};


/**
 * Gets or sets the redis client for this integration
 *
 * @param  {Redis}       redis
 * @return {Redis|this}
 */

Integration.prototype.redis = function (redis) {
  if (!redis) return this._redis;

  this._redis = redis;
  return this;
};