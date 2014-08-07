
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
 * Add option `name` with `meta`.
 *
 * @param {String} name
 * @param {Object|Function} meta
 * @return {Integration}
 * @api public
 */

exports.option = function(name, meta){
  this.options = this.options || {};
  var self = this;

  if (meta && meta.required) {
    return this.option(name, function(msg, settings){
      if (has.call(settings, name)) return;
      var err = fmt('missing required setting "%s" got settings "%j"', name, settings);
      return self.error('validation', err, {
        settings: settings,
        message: msg
      });
    });
  }

  this.options[name] = meta || function(){};
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
  var opts = this.options;
  var err;

  for (var k in opts) {
    var fn = opts[k];
    if (!has.call(opts, k)) continue;
    if (err = fn(msg, settings)) return err;
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
 * Add channel shortcuts.
 *
 * @return {Integration}
 * @api public
 */

channels.forEach(function(channel){
  exports[channel] = function(){
    return this.channel(channel);
  };
});
