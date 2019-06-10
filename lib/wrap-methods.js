
/**
 * Module dependencies.
 */

var events = require('analytics-events')

/**
 * Methods to wrap.
 */

var methods = [
  ...Object.keys(events),
  'identify',
  'screen',
  'alias',
  'track',
  'group',
  'page',
  'delete'
]

/**
 * Wrap methods of `integration`.
 *
 *    - uses `mapper` if possible
 *    - routes all ecommerce events to other methods if possible.
 *
 * @param {Integration} integration
 * @api private
 */

module.exports = function (integration) {
  // route ecommerce
  var track = integration.track
  integration.track = track && function (msg) {
    var event = msg.event()

    for (var method in events) {
      var regexp = events[method]
      var fn = this[method]
      if (!fn || !regexp.test(event)) continue
      return fn.apply(this, arguments)
    }

    return track.apply(this, arguments)
  }
}
