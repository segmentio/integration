
/**
 * Module dependencies.
 */

var fmt = require('util').format;
var ms = require('ms');

/**
 * Has own property ref.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Channels.
 */

var channels = [
  'server',
  'mobile',
  'client'
];

/**
 * Add requirement `path`.
 *
 * Example:
 *
 *       // require .userId on all methods.
 *      requires('userId');
 *
 *      // require .userId only on .idenify
 *      requires('identify', 'userId');
 *
 * @param {String} methods
 * @param {String} path
 * @return {Integration}
 * @api public
 */

exports.requires = function(method, path){
  var reqs = this.requirements || [];
  var self = this;
  var req = {};

  // default all methods
  if (!path) path = method, method = null;

  // remember path/method
  req.method = method;
  req.path = path;

  // validates a message
  req.validate = function(msg){
    if (req.method && msg.type() != req.method) return;
    if (get(msg, path)) return;
    var err = fmt('missing attribute "%s" in "%s"', path, msg.type());
    // TODO: maybe a new error type here...
    return self.error('validation', err, {});
  };

  // TODO: add .get() to facade?
  function get(msg, path){
    return 'function' == typeof msg[path]
      ? msg[path]()
      : msg.proxy(path);
  }

  // add requirement
  reqs.push(req);

  this.requirements = reqs;
  return this;
};

/**
 * Add option `name` with `meta`.
 *
 * @param {String} name
 * @param {Object|Function} meta
 * @return {Integration}
 * @api public
 */

exports.option = function(name, meta){
  this.options = this.options || {};
  var meta = meta || {};
  var self = this;

  if (meta && meta.required) {
    meta.validate = function(msg, settings){
      if (has.call(settings, name)) return;
      var err = fmt('missing required setting "%s" got settings "%j"', name, settings);
      return self.error('validation', err, {
        settings: settings,
        message: msg
      });
    };
  }

  if (!meta.validate) meta.validate = noop;
  this.options[name] = meta;
  return this;
};

/**
 * Validate integration using `settings`.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {ValidationError}
 * @api public
 */

exports.validate = function(msg, settings){
  var reqs = this.requirements || [];
  var opts = this.options || {};
  var err;

  // options
  for (var k in opts) {
    var meta = opts[k];
    if (!has.call(opts, k)) continue;
    if (err = meta.validate(msg, settings)) return err;
  }

  // attributes
  for (var i = 0, req; req = reqs[i++];) {
    if (err = req.validate(msg)) return err;
  }
};

/**
 * Set the endpoint with `url`.
 *
 * @param {String} url
 * @return {Integration}
 * @api public
 */

exports.endpoint = function(url){
  this.prototype.endpoint = url;
  return this;
};

/**
 * Set `n` retries for all requests.
 *
 * @param {Number} n
 * @return {Integration}
 * @api public
 */

exports.retries = function(n){
  this.prototype.retries = n;
  return this;
};

/**
 * Set mapper to `mapper`.
 *
 * TODO: deprecate
 *
 * @param {Object} mapper
 * @return {Integration}
 * @api public
 */

exports.mapper = function(mapper){
  this.prototype.mapper = mapper;
  return this;
};

/**
 * Set the timeout to `timeout`
 *
 * @param {Number|String} timeout in ms
 * @return {Integration}
 * @api public
 */

exports.timeout = function(timeout){
  if ('string' == typeof timeout) timeout = ms(timeout);
  this.prototype.timeout = timeout;
  return this;
};

/**
 * Enable this integration on `channel`.
 *
 * TODO: deprecate
 *
 * @param {String} channel
 * @return {Integration}
 * @api public
 */

exports.channel = function(channel){
  var chans = this.prototype.channels || [];
  if (~chans.indexOf(channel)) return this;
  chans.push(channel);
  this.prototype.channels = chans;
  return this;
};

/**
 * Enable this integration on `channels`.
 *
 * TODO: validate array for typos.
 *
 * @param {Array} channels
 * @return {Integration}
 * @api public
 */

exports.channels = function(channels){
  this.prototype.channels = channels;
  return this;
};

/**
 * Add channel shortcuts.
 *
 * TODO: deprecate
 *
 * @return {Integration}
 * @api public
 */

channels.forEach(function(channel){
  exports[channel] = function(){
    return this.channel(channel);
  };
});

/**
 * Noop
 */

function noop(){}
