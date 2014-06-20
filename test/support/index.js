
var Track = require('segmentio-facade').Track;

/**
 * Track
 */

exports.track = function(obj){
  return new Track(merge({
    userId: 'id',
    event: 'event',
    properties: {},
    timestamp: new Date,
    channel: 'server'
  }, obj));
};

/**
 * Merge `a`, `b`.
 *
 * @param {Object} a
 * @param {Object} b
 */

function merge(a, b){
  b = b || {};
  for (var k in b) a[k] = b[k];
  return a;
}
