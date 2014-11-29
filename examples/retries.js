

/**
 * Module dependencies.
 */

var Track = require('segmentio-facade').Track;
var integration = require('..');
var assert = require('assert');

/**
 * Expose `Example`
 */

var Example = module.exports = integration('Example')
  .channels(['server', 'mobile', 'client'])
  .endpoint('http://localhost:12345');

/**
 * Track.
 */

Example.prototype.track = function(msg, fn){
  this.request().end(fn);
};

/**
 * Send request.
 */

var msg = new Track({});
var example = new Example({});

example.track(msg, function(err, res){
  assert(err.code, 'ECONNREFUSED');
  assert(example.retry(err), true, 'should retry');
});