
/**
 * Module dependencies.
 */

var ValidationError = require('./errors').Validation;
var normalize = require('to-no-case');
var request = require('superagent');
var fmt = require('util').format;
var methods = require('methods');
var type = require('type');

/**
 * Superagent .retry(n) patch
 */

require('superagent-retry')(request);

/**
 * Initialize.
 *
 * @api public
 */

exports.initialize = function(){};

/**
 * Identify.
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.identify = tick();

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.track = tick();

/**
 * Alias.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.alias = tick();

/**
 * Group.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.group = tick();

/**
 * Page.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.page = tick();

/**
 * Screen.
 *
 * @param {Screen} screen
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.screen = tick();

/**
 * Enabled.
 *
 * @param {Facade} facade
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

exports.enabled = function(facade, settings){
  return !!~ this.channels.indexOf(facade.channel())
    && facade.enabled(this.name);
};

/**
 * Get events that match `str`.
 * 
 * Examples:
 * 
 *    events = { my_event: 'a4991b88' }
 *    .map(events, 'My Event');
 *    // => ["a4991b88"]
 *    .map(events, 'whatever');
 *    // => []
 * 
 *    events = [{ key: 'my event', value: '9b5eb1fa' }]
 *    .map(events, 'my_event');
 *    // => ["9b5eb1fa"]
 *    .map(events, 'whatever');
 *    // => []
 * 
 * @param {Object} events
 * @param {String} str
 * @return {Array}
 * @api public
 */

exports.map = function(events, str){
  var a = normalize(str);
  var ret = [];

  // no events
  if (!events) return ret;

  // object
  if ('object' == type(events)) {
    for (var k in events) {
      var item = events[k];
      var b = normalize(k);
      if (b == a) ret.push(item);
    }
  }

  // array
  if ('array' == type(events)) {
    if (!events.length) return ret;
    if (!events[0].key) return ret;

    for (var i = 0; i < events.length; ++i) {
      var item = events[i];
      var b = normalize(item.key);
      if (b == a) ret.push(item.value);
    }
  }

  return ret;
};

/**
 * Create a new request with `method` and optional `path`.
 *
 * @param {String} method
 * @param {String} path
 * @api private
 */

exports.request = function(method, path){
  method = method || 'get';
  var url = path || '';
  var self = this;
  if (!isAbsolute(url)) url = this.endpoint + url;
  this.debug('create request %s', method, url);
  var req = request[method](url);
  req.on('response', this.onresponse.bind(this));
  if (this.retries) req.retry(this.retries);
  if (this.timeout) req.timeout(this.timeout);
  var end = req.end;
  req.end = onend;
  req.redirects(0);
  return req;

  function onend(){
    self.emit('request', this);
    self.debug('request %s %j', req.url, req._data);
    end.apply(this, arguments);
  }
};

/**
 * Assert `name`, `value` or return an error.
 *
 * @param {Mixed} value
 * @return {ValidationError}
 * @api private
 */

exports.ensure = function(value, name){
  if (2 != arguments.length) throw new TypeError('.ensure() requires two arguments');
  if (value) return;
  var msg = fmt('"%s" integration requires "%s"', this.name, name);
  return new ValidationError(msg);
};

/**
 * Set / get redis `client`.
 *
 * @param {Redis} client
 * @return {Redis|Integration}
 * @api private
 */

exports.redis = function(client){
  if (1 == arguments.length) {
    this.client = client;
    return this;
  }

  return this.client;
};

/**
 * Set / get `logger`.
 *
 * @param {Logger} logger
 * @return {Redis|Integration}
 * @api private
 */

exports.logger = function(logger){
  if (1 == arguments.length) {
    this.log = logger;
    return this;
  }

  return this.log;
};

/**
 * onresponse.
 *
 * @param {Response} res
 * @api private
 */

exports.onresponse = function(res){
  this.debug('response %d %j', res.status, res.body);
  this.emit('response', res);
};

/**
 * Handle response with the given `fn`
 *
 * @param {Function} fn
 * @return {Function}
 * @api private
 */

exports.handle = function(fn){
  return function(err, res){
    if (err) return fn(err);
    if (res.error) return fn(res.error, res);
    fn(null, res);
  };
};

/**
 * Add methods
 */

methods.forEach(function(method){
  if ('delete' == method) method = 'del';
  if ('search' == method) return;
  exports[method] = function(path){
    return this.request(method, path);
  };
});

/**
 * Tick.
 *
 * @return {Function}
 * @api private
 */

function tick(){
  return function(_, _, fn){
    process.nextTick(fn);
  };
}

/**
 * Is absolute.
 *
 * @param {String} url
 * @return {Boolean}
 * @api private
 */

function isAbsolute(url){
  return 0 == url.indexOf('https:')
    || 0 == url.indexOf('http:');
}
