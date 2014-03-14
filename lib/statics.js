
/**
 * Module dependencies.
 */

var channels = require('./channels');

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
