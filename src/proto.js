
/**
 * Module dependencies.
 */

var ResourceLockedError = require('./errors').ResourceLockedError
var ValidationError = require('./errors').Validation
var normalize = require('to-no-case')
var request = require('superagent')
var retries = require('./retries')
var fmt = require('util').format
var includes = require('lodash/includes')
var methods = require('methods')
var http = require('http')
var https = require('https')
const { isBoolean } = require('lodash')

/**
 * Retry checks.
 *
 * @var {Array}
 * @api private
 */

exports.checks = retries

/**
 * Initialize.
 *
 * @api public
 */

exports.initialize = function () {
  this.debug('initialize')
}

/**
 * Enabled.
 *
 * @param {Facade} facade
 * @param {Object} settings
 * @return {Boolean}
 * @api public
 */

exports.enabled = function (facade) {
  // Pass event unconditionally if it's a replay event
  if (facade.proxy('replay')) {
    return
  }

  // Follow the override if a boolean is set on the integration instance.
  if (isBoolean(this.overrideEnabled)) {
    if (this.overrideEnabled) {
      return
    }

    return this.reject('%s has been explicitly disabled.', this.name)
  }

  if (!facade.enabled(this.name)) {
    return this.reject('%s has been explicitly disabled in the event payload in the `integrations` object.', this.name)
  }
  // Pass through event for unbundled analytics.js integration if
  // - this event came from the browser
  // - this integration is explicitly unbundled in analytics.js
  if (facade.channel() === 'client' && includes(facade.proxy('_metadata.unbundled'), this.name)) {
    return
  }
  if (!includes(this.channels, facade.channel())) {
    const err = new Error('this message was sent client side')
    err.status = 'MESSAGE_SENT_CLIENT_SIDE'
    return err
  }
}

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

exports.map = function (events, str) {
  var a = normalize(str)
  var ret = []

  // no events
  if (!events) return ret

  if (Array.isArray(events)) {
    if (!events.length) return ret
    if (!events[0].key) return ret

    for (var i = 0; i < events.length; ++i) {
      var item = events[i]
      var b = normalize(item.key)
      if (b === a) ret.push(item.value)
    }
  } else if (typeof events === 'object') {
    for (var k in events) {
      item = events[k]
      b = normalize(k)
      if (b === a) ret.push(item)
    }
  }

  return ret
}

/**
 * Lock `key`.
 *
 * @param {String} key
 * @param {Function} fn
 * @api public
 */

exports.lock = async function (key, timeout, fn) {
  if (typeof timeout === 'function') {
    fn = timeout
    timeout = 15000
  } else if (timeout === undefined) {
    timeout = 15000
    fn = promiseWrapper
  } else if (typeof timeout === 'number' && fn === undefined) {
    fn = promiseWrapper
  }

  const name = this.name

  key = [name, key].join(':')

  try {
    const ok = await this.redis().setAsync(key, 1, 'NX', 'PX', timeout)
    if (!ok) return fn(new ResourceLockedError(fmt('key `%s` is locked', key), name))
    return fn()
  } catch (e) {
    return fn(e)
  }
}

/**
 * Unlock `key`.
 *
 * @param {String} key
 * @api public
 */

exports.unlock = async function (key, fn) {
  if (arguments.length === 0) throw new Error('Key is required.')

  const emit = this.emit.bind(this)

  fn = fn || promiseWrapper

  key = [this.name, key].join(':')

  try {
    await this.redis().delAsync(key)
    this.locked = false
    return fn()
  } catch (e) {
    emit('unlock error', e)
    return fn(e)
  }
}

/**
 * Create a new request with `method` and optional `path`.
 *
 * @param {String} method
 * @param {String} path
 * @api private
 */

exports.request = function (method, path) {
  method = method || 'get'
  var url = path || ''
  var self = this

  if (!isAbsolute(url)) url = this.endpoint + url
  this.debug('create request %s', method, url)

  var req = request[method](url)
  var end = req.end

  if (this.ca) req.ca(this.ca)
  if (this.timeout) req.timeout(this.timeout)

  if (this.agent) {
    req.agent(this.agent)
  } else if (url.indexOf('http:') === 0) {
    req.agent(http.globalAgent)
  } else if (url.indexOf('https:') === 0) {
    req.agent(https.globalAgent)
  }

  req.on('response', this.onresponse.bind(this))
  req.set('User-Agent', 'Segment.io/1.0')
  // Superagent sets Accept-Encoding: gzip, deflate by default. We don't want
  // any encoding, since compressing TLS responses with gzip makes them
  // vulnerable to the CRIME attack.
  //
  // There may also be a problem with the Node zlib library using a ton of
  // memory to decompress messages.
  req.set('Accept-Encoding', 'identity')
  req.redirects(0)
  req.end = onend

  function onend (fn) {
    fn = fn || noop
    self.emit('request', this)
    self.debug('request %s %j', req.url, req._data)
    return end.call(this, function (err, res) {
      if (err) return onerror(err, res, fn)
      if (res.error) return onerror(res.error, res, fn)
      res.req = req
      return fn(null, res)
    })
  }

  function onerror (err, res, fn) {
    if (err.timeout) err.code = 'ECONNABORTED'
    err.origin = 'DESTINATION'
    return fn(err, res)
  }

  // Captures the current async context by creating an async resource for the
  // superagent request.
  //
  // This is necessary because async_hooks does not follow "Thenable" types,
  // depsite promises being compatible with them. The "then" method is invoked
  // asynchronously on a "nextTick", where the async context that originally
  // created the "Thenable" object has been lost.
  //
  // By creating the async resource here and overriding the "then" method, we
  // bind the request object to the async execution context, and can restore
  // it via a call to runInAsyncScope in the overriden "then" function.
  const asyncResource = new AsyncResource('com.segment.integration.Request')
  const thenFunction = Reflect.get(req, 'then')
  const thenAsyncHook = function then (resolve, reject) {
    return asyncResource.runInAsyncScope(thenFunction, this, resolve, reject)
  }

  req.then = thenAsyncHook
  return req
}

/**
 * Assert `name`, `value` or return an error.
 *
 * @param {Mixed} value
 * @return {ValidationError}
 * @api private
 */

exports.ensure = function (value, name) {
  if (arguments.length !== 2) throw new TypeError('.ensure() requires two arguments')
  if (value) return
  var msg = fmt('"%s" integration requires "%s"', this.name, name)
  return new ValidationError(msg)
}

/**
 * Set / get redis `client`.
 *
 * @param {Redis} client
 * @return {Redis|Integration}
 * @api private
 */

exports.redis = function (client) {
  if (arguments.length === 1) {
    this.client = client
    return this
  }

  return this.client
}

/**
 * Set / get `jstarce`.
 *
 * @param {Function} fn
 * @return {Integration|Function}
 * @api private
 */

exports.jstrace = function (fn) {
  if (arguments.length === 1) {
    this._trace = fn
    return this
  }

  return this._trace || noop
}

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

exports.trace = function () {
  this.jstrace().apply(null, arguments)
}

/**
 * onresponse.
 *
 * @param {Response} res
 * @api private
 */

exports.onresponse = function (res) {
  this.debug('response %d %j', res.status, res.body)
  this.emit('response', res)
}

/**
 * Handle response with the given `fn`
 *
 * TODO: deprecate.
 *
 * @param {Function} fn
 * @return {Function}
 * @api private
 * @deprecated
 */

exports.handle = function (fn) {
  return function (err, res) {
    if (err) return fn(err, res)
    fn(null, res)
  }
}

/**
 * Determine if the `err` is retriable.
 *
 * This method should be invoked from an application
 * after receiving an error from any analytics method
 * in order to determine if the request should be retried.
 *
 * @param {Error} err
 * @return {Boolean}
 * @api public
 */

exports.retry = function (err) {
  return err && this.checks.some(function (fn) {
    return fn(err)
  })
}

/**
 * Add methods
 */

methods.forEach(function (method) {
  if (method === 'delete') method = 'del'
  if (method === 'trace') return
  if (method === 'lock') return
  if (method === 'unlock') return
  if (method === 'search') return
  exports[method] = function (path) {
    return this.request(method, path)
  }
})

/**
 * Is absolute.
 *
 * @param {String} url
 * @return {Boolean}
 * @api private
 */

function isAbsolute (url) {
  return url.indexOf('https:') === 0 ||
    url.indexOf('http:') === 0
}

/**
 * Noop.
 */

function noop () {}

/**
 * Promise Wrapper.
 */

const promiseWrapper = (err, res) => {
  if (err) {
    return Promise.reject(err)
  } else {
    return Promise.resolve(res)
  }
}
