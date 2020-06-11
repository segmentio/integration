
/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter
var wrapMethods = require('./wrap-methods')
var statics = require('./statics')
var errors = require('./errors')
var fmt = require('util').format
var proto = require('./proto')
var assert = require('assert')
var debug = require('debug')

class Flags {
  constructor(flagArray = []) {
    this.flagSet = new Set(flagArray)
  }

  on(flag) {
    return this.flagSet.has(flag)
  }
}

/**
 * Expose `createIntegration`
 */

exports = module.exports = createIntegration

/**
 * Expose `errors`.
 */

exports.errors = errors
exports.Flags = Flags

/**
 * Create integration with `name`.
 *
 * @param {String} name
 * @api public
 */

function createIntegration (name) {
  assert(name, 'expected integration name')

  /**
   * Initialize a new `Integration`.
   *
   * @api public
   */

  function Integration (settings, flags) {
    if (!(this instanceof Integration)) return new Integration(settings, flags)
    this.debug = debug('segmentio:integration:' + this.slug())
    this.settings = settings || {}
    this.flags = flags || new Flags()
    Emitter.call(this)
    this.initialize()
    wrapMethods(this)
  }

    /**
   * Inherit `Emitter`
   */

  Integration.prototype = Object.create(Emitter.prototype)

  Object.defineProperty(Integration.prototype, 'constructor', {
    value: Integration,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

  /**
   * Expose `name`
   */

  Integration.prototype.name = name

  merge(Integration.prototype, proto)
  merge(Integration, statics)

  /**
   * Validations.
   */

  Integration.validations = []

  /**
   * Enabled on server
   */

  Integration.server()

  /**
   * Create error with `msg`.
   *
   * @param {String} msg
   * @param {...} args
   * @return {Error}
   * @api public
   */

  Integration.error =
  Integration.prototype.error = function () {
    var msg = fmt.apply(null, arguments)
    // TODO: cache and add .request and .response to ctx.
    var ctx = {}
    return new errors.BadRequestError(msg, name, ctx)
  }

  /**
   * Create validation error with `reason`.
   *
   * @param {String} reason
   * @param {...} args
   * @return {Error}
   * @api public
   */

  Integration.invalid =
  Integration.prototype.invalid = function () {
    var msg = fmt.apply(null, arguments)
    return new errors.ValidationError(msg, name)
  }

  /**
   * Reject a message with `reason`.
   *
   * @param {String} reason
   * @param {...} args
   * @return {Error}
   * @api public
   */

  Integration.reject =
  Integration.prototype.reject = function () {
    var msg = fmt.apply(null, arguments)
    return new errors.RejectedError(msg, name)
  }

  /**
   * Get the `name` in "slug" format.
   *
   * @return {String}
   * @api public
   */

  Integration.slug =
  Integration.prototype.slug = function () {
    return Integration.prototype.name
    .toLowerCase()
    .replace(/^ +| +$/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  }

  /**
   * Set a default timeout
   */

  Integration.timeout('10s')

  return Integration
};

/**
 * Merge `a`, `b`.
 *
 * @param {Object} a
 * @param {Object} b
 * @api private
 */

function merge (a, b) {
  for (var k in b) a[k] = b[k]
}
