
/**
 * Module dependencies.
 */

var events = require('analytics-events');

/**
 * Methods to wrap.
 */

var methods = [
  'identify',
  'screen',
  'alias',
  'track',
  'group',
  'page'
];

/**
 * Wrap methods of `integration`.
 *
 *    - uses `mapper` if possible
 *    - routes all ecommerce events to other methods if possible.
 *
 * @param {Integration} integration
 * @api private
 */

module.exports = function(integration){
  var mapper = integration.mapper || {};

  // use mapper.
  methods.forEach(function(method){
    if (!mapper[method]) return;
    var fn = integration[method];
    integration[method] = function(message, callback){
      var payload = mapper[method].call(this, message, this.settings);
      this.debug('mapped %j to %j', message, payload);
      return fn.call(this, payload, callback);
    };
  });

  // Check for and use spec'd events.
  var track = integration.track;
  integration.track = function(msg, callback){
    var event = msg.event();
    var fn;
    var method;

    for (method in events) {
      var regexp = events[method];
      fn = this[method]
      if (!fn || !regexp.test(event)) continue;
      break;
    }

    // If we have exited the loop with fn undefined, default back to track and return.
    if (!fn) {
      return track.call(this, msg, callback)
    }

    if (mapper[method]) {
      var payload = mapper[method].call(this, msg, this.settings);
      this.debug('mapped %j to %j', msg, payload);
      return fn.call(this, payload, callback);
    }

    return fn.call(this, msg, callback)
  }

};