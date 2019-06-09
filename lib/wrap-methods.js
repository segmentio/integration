
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
  var mapper = integration.mapper || {}

  // use mapper.
  methods.forEach(function (method) {
    if (!mapper[method] || !integration[method]) return // only wrap method if it is defined in both mapper and index
    var fn = integration[method]
    integration[method] = function (message, callback) {
      var payload = mapper[method].call(this, message, this.settings)
      this.debug('mapped %j to %j', message, payload)
      return fn.call(this, payload, callback)
    }
  })

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
