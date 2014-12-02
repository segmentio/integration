
/**
 * Module dependencies.
 */

var ValidationError = require('./errors').Validation;
var normalize = require('to-no-case');
var request = require('superagent');
var Lock = require('shared-lock');
var fmt = require('util').format;
var methods = require('methods');
var Batch = require('batch');
var type = require('type');

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

exports.identify;

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.track;

/**
 * Alias.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.alias;

/**
 * Group.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.group;

/**
 * Page.
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.page;

/**
 * Screen.
 *
 * @param {Screen} screen
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

exports.screen;

/**
 * Enabled.
 *
 * @param {Facade} facade
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

exports.enabled = function(facade){
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
 * Lock `key`.
 *
 * @param {String} key
 * @param {Function} fn
 * @api public
 */

exports.lock = function(key, fn){
  var key = [this.name, key].join(':');
  var lock = Lock({ key: key, redis: this.redis(), retry: 100 });
  var emit = this.emit.bind(this);
  lock.lock(function(err){
    if (err) emit('lock error', err, lock);
    fn();
  });
};

/**
 * Unlock `key`.
 *
 * @param {String} key
 * @api public
 */

exports.unlock = function(key, fn){
  var key = [this.name, key].join(':');
  var lock = Lock({ key: key, redis: this.redis() });
  var emit = this.emit.bind(this);
  lock.unlock(function(err){
    if (err) emit('unlock error', err, lock);
    fn();
  });
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
  req.set('User-Agent', 'Segment.io/1.0');
  req.on('response', this.onresponse.bind(this));
  if (this.timeout) req.timeout(this.timeout);
  var end = req.end;
  req.end = onend;
  req.redirects(0);
  return req;

  function onend(){
    self.emit('request', this);
    self.debug('request %s %j', req.url, req._data);
    return end.apply(this, arguments);
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
 * Set / get `jstarce`.
 *
 * @param {Function} fn
 * @return {Integration|Function}
 * @api private
 */

exports.jstrace = function(fn){
  if (1 == arguments.length) {
    this._trace = fn;
    return this;
  }

  return this._trace || noop;
};

/**
 * Trace `msg`.
 *
 * Example:
 *
 *    trace('user:create', { id: 'user-id' });
 *
 * @param {String} msg
 * @param {Object} mixed
 * @api public
 */

exports.trace = function(){
  this.jstrace().apply(null, arguments);
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
 * Retry?
 *
 * This method gets invoked by the worker
 * after the worker recieves an `(err,)`, it
 * will call this method to figure out if this integration
 * needs to retry this request.
 *
 * By default it checks for:
 *
 *  - `.status=502`
 *  - `.status=503`
 *  - `.status=504`
 *  - `.code=ETIMEDOUT`
 *  - `.code=EADDRINFO`
 *  - `.code=ECONNRESET`
 *  - `.code=ESOCKETTIMEDOUT`
 *  - `.timeout=N` (superagent's timeout)
 *
 * You can "extend" this method easily like:
 *
 *   var retry = proto.retry;
 *   proto.retry = function(err){
 *     return retry.apply(this, arguments) 
 *       || 429 == err.status; // "too many requests"
 *   };
 *
 * @param {Error} err
 * @return {Boolean}
 * @api public
 */

exports.retry = function(err){
  return !!~[502,503,504].indexOf(err.status)
    || err.code == 'ETIMEDOUT'
    || err.code == 'EADDRINFO'
    || err.code == 'ECONNRESET'
    || err.code == 'ESOCKETTIMEDOUT'
    || !!err.timeout;
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
    if (err) return fn(err, res);
    if (res.error) return fn(res.error, res);
    fn(null, res);
  };
};

/**
 * Add methods
 */

methods.forEach(function(method){
  if ('delete' == method) method = 'del';
  if ('trace' == method) return;
  if ('lock' == method) return;
  if ('unlock' == method) return;
  if ('search' == method) return;
  exports[method] = function(path){
    return this.request(method, path);
  };
});

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

/**
 * Noop.
 */

function noop(){}
