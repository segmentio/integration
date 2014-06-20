
/**
 * Module dependencies.
 */

var events = require('analytics-events');

/**
 * Add ecommerce capabilities to `integration.track()`.
 *
 * @param {Integration} integration
 */

module.exports = function(integration){
  var track = integration.track;
  integration.track = function(msg){
    var event = msg.event();

    for (var method in events) {
      var regexp = events[method];
      var fn = this[method];
      if (!fn || !regexp.test(event)) continue;
      return this[method].apply(this, arguments);
    }

    return track.apply(this, arguments);
  };
};
