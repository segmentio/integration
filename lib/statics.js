
/**
 * Module dependencies.
 */

var fmt = require('util').format;
var assert = require('assert');
var ms = require('ms');

/**
 * Channels.
 */

var channels = [
  'server',
  'mobile',
  'client'
];

/**
 * Add a new mapping option.
 *
 * This will create a method `key` that will return a mapping
 * for you to use.
 *
 * Example:
 *
 *    Integration('My Integration')
 *      .mapping('events');
 *
 *    new MyIntegration().track('My Event');
 *
 *    .track = function(track){
 *      var events = this.events(track.event());
 *      each(events, send);
 *     };
 *
 * @param {String} key
 * @return {Integration}
 */

exports.mapping = function(key){
  this.prototype[key] = function(str){
    return this.map(this.settings[key], str);
  };
  return this;
};

/**
 * Ensure `type.path` with optional `meta`.
 *
 * Examples:
 *
 *      .ensure('settings.apiKey');
 *      .ensure('message.userId');
 *      .ensure('message.userId', { methods: ['track'] });
 *      .ensure('settings.apiKey', function(msg, settings){});
 *
 * @param {String} path
 * @param {Object} meta
 * @return {Integration}
 * @api public
 */

exports.ensure = function(path, meta){
  // function
  if ('function' == typeof path) {
    this.validations.push({
      validate: path
    });
    return this;
  }

  // default
  var parts = path.split('.');
  var type = parts[0];
  var meta = meta || {};

  // types
  assert(~['settings', 'message'].indexOf(type)
    , 'message type must be "message" or "settings" '
    + ', but got "' + type + '"');

  // requirement
  meta.type = type;
  meta.path = parts.slice(1).join('.');
  meta.validate = validation(meta);

  // add requirement.
  this.validations.push(meta);
  return this;
};

/**
 * Validate.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

exports.validate = function(msg, settings){
  var all = Object.keys(this.validations);

  for (var i = 0, err, fn; i < all.length; ++i) {
    fn = this.validations[i].validate;
    if (err = fn.call(this, msg, settings)) return err;
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
 * Create validation function with `meta`.
 *
 * @param {Object} meta
 * @return {Function}
 * @api private
 */

function validation(meta){
  return function(msg, settings){
    var methods = meta.methods;
    var type = meta.type;
    var path = meta.path;

    // methods
    if (methods && !~methods.indexOf(msg.type())) return;

    // settings
    if ('settings' == type) {
      var value = settings[path];
      if (null != value && '' != value) return;
      return this.invalid('setting "%s" is required', path);
    }

    // message
    if (has(msg, path)) return;

    // error
    return this.reject('message attribute "%s" is required', path);
  };
}

/**
 * Check if `msg` has `path`.
 *
 * this is required because facade.proxy()
 * returns an object for userId etc...
 *
 * TODO: fix this in facade.
 *
 * @param {Facade} msg
 * @param {String} path
 * @return {Boolean}
 * @api private
 */

function has(msg, path){
  return 'function' == typeof msg[path]
    ? null != msg[path]()
    : null != msg.proxy(path);
}

/**
 * Noop
 */

function noop(){}
