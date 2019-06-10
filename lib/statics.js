
/**
 * Module dependencies.
 */

var assert = require('assert')
var Batch = require('batch')
var ms = require('ms')

/**
 * Channels.
 */

var channels = [
  'server',
  'mobile',
  'client'
]

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

exports.mapping = function (key) {
  this.prototype[key] = function (str) {
    return this.map(this.settings[key], str)
  }
  return this
}

/**
 * Map page / screen calls to .track().
 *
 * The method will replace `.page()` and or `.screen()`
 * with a method that will map all calls to `.track()`.
 *
 * Example:
 *
 *      // maps .page() -> track()
 *      .toTrack(['page']);
 *
 * @param {Array} methods
 * @return {Integration}
 * @api public
 */

exports.mapToTrack = function (methods) {
  assert(Array.isArray(methods), '.toTrack() expects an array')
  if (~methods.indexOf('page')) this.prototype.page = mapToTrack
  if (~methods.indexOf('screen')) this.prototype.screen = mapToTrack
  return this
}

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

exports.ensure = function (path, meta) {
  // function
  if (typeof path === 'function') {
    this.validations.push({
      validate: path
    })
    return this
  }

  // default
  var parts = path.split('.')
  var type = parts[0]
  meta = meta || {}

  // types
  assert(~['settings', 'message'].indexOf(type),
         'message type must be "message" or "settings" ' + ', but got "' + type + '"')

  // requirement
  meta.type = type
  meta.path = parts.slice(1).join('.')
  meta.validate = validation(meta)

  // add requirement.
  this.validations.push(meta)
  return this
}

/**
 * Validate.
 *
 * @param {Facade} msg
 * @param {Object} settings
 * @return {Error}
 * @api public
 */

exports.validate = function (msg, settings) {
  var all = Object.keys(this.validations)

  for (var i = 0, err, fn; i < all.length; ++i) {
    fn = this.validations[i].validate
    err = fn.call(this, msg, settings)
    if (err) return err
  }
}

/**
 * Set the endpoint with `url`.
 *
 * @param {String} url
 * @return {Integration}
 * @api public
 */

exports.endpoint = function (url) {
  this.prototype.endpoint = url
  return this
}

 /* Set `n` retries for all requests.
  *
  * Deprecated, does nothing.
  * replaced by `#retry(err)`.
  *
  * @param {Number} n
  * @return {Integration}
  * @api public
  */

exports.retries = function (n) {
  this.prototype.retries = n
  return this
}

/**
 * Set the retry `checks` array.
 *
 * @param {Number} n
 * @return {Integration}
 * @api public
 */

exports.retry = function (fn) {
  this.prototype.checks.push(fn)
  return this
}

/**
 * Set the timeout to `timeout`
 *
 * @param {Number|String} timeout in ms
 * @return {Integration}
 * @api public
 */

exports.timeout = function (timeout) {
  if (typeof timeout === 'string') timeout = ms(timeout)
  this.prototype.timeout = timeout
  return this
}

/**
 * Sets the `http.Agent` for all requests.
 *
 * @param {http.Agent} agent
 * @return {Integration}
 * @api public
 */

exports.agent = function (agent) {
  this.prototype.agent = agent
  return this
}

/**
 * Sets the list of cas to use for all https
 * requests.
 *
 * @param {Buffer | Array} cert
 * @return {Request} for chaining
 * @api public
 */

exports.ca = function (ca) {
  this.prototype.ca = ca
  return this
}

/**
 * Enable this integration on `channel`.
 *
 * TODO: deprecate
 *
 * @param {String} channel
 * @return {Integration}
 * @api public
 */

exports.channel = function (channel) {
  var chans = this.prototype.channels || []
  if (~chans.indexOf(channel)) return this
  chans.push(channel)
  this.prototype.channels = chans
  return this
}

/**
 * Enable this integration on `channels`.
 *
 * @param {Array} channels
 * @return {Integration}
 * @api public
 */

exports.channels = function (channels) {
  // Overwrite channels with this exact set
  this.prototype.channels = []
  channels.forEach(function (channel) {
    this.channel(channel)
  }, this)
  return this
}

/**
 * Add channel shortcuts.
 *
 * TODO: deprecate
 *
 * @return {Integration}
 * @api public
 */

channels.forEach(function (channel) {
  exports[channel] = function () {
    return this.channel(channel)
  }
})

/**
 * Create validation function with `meta`.
 *
 * @param {Object} meta
 * @return {Function}
 * @api private
 */

function validation (meta) {
  return function (msg, settings) {
    var methods = meta.methods
    var type = meta.type
    var path = meta.path

    // methods
    if (methods && !~methods.indexOf(msg.type())) return

    // settings
    if (type === 'settings') {
      var value = settings[path]
      if (value !== null && undefined !== value && value !== '') return
      return this.invalid('setting "%s" is required', path)
    }

    // message
    if (has(msg, path)) return

    // error
    return this.reject('message attribute "%s" is required', path)
  }
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

function has (msg, path) {
  return typeof msg[path] === 'function'
    ? msg[path]() != null
    : msg.proxy(path) != null
}

/**
 * Map to track.
 *
 * @param {Page|Screen}
 * @param {Function} fn
 * @api private
 */

function mapToTrack (msg, fn) {
  var batch = new Batch()
  var category = msg.category()
  var name = msg.fullName()
  var self = this

  // all.
  if (this.settings.trackAllPages) {
    batch.push(track(msg.track()))
  }

  // categorized.
  if (category && this.settings.trackCategorizedPages) {
    batch.push(track(msg.track(category)))
  }

  // named.
  if (name && this.settings.trackNamedPages) {
    batch.push(track(msg.track(name)))
  }

  // call track with `msg`.
  function track (msg) {
    return function (done) {
      self.track(msg, function (err, res) {
        if (err) return done(err)
        done(null, res)
      })
    }
  }

  batch.end(fn)
}
