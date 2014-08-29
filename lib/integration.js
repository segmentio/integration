
/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter;
var wrapMethods = require('./wrap-methods');
var slug = require('slug-component');
var statics = require('./statics');
var errors = require('./errors');
var fmt = require('util').format;
var proto = require('./proto');
var assert = require('assert');
var debug = require('debug');
var ms = require('ms');

/**
 * Expose `createIntegration`
 */

exports = module.exports = createIntegration;

/**
 * Expose `errors`.
 */

exports.errors = errors;

/**
 * Create integration with `name`.
 *
 * @param {String} name
 * @api public
 */

function createIntegration(name){
  assert(name, 'expected integration name');

  /**
   * Initialize a new `Integration`.
   *
   * @api public
   */

  function Integration(settings){
    if (!(this instanceof Integration)) return new Integration(settings);
    this.debug = debug('segmentio:integration:' + slug(name));
    this.settings = settings;
    Emitter.call(this);
    this.initialize();
    wrapMethods(this);
  }

  /**
   * Expose `name`
   */

  Integration.prototype.name = name;

  /**
   * Inherit `Emitter`
   */

  Integration.prototype.__proto__ = Emitter.prototype;
  merge(Integration.prototype, proto);
  merge(Integration, statics);

  /**
   * Validations.
   */

  Integration.validations = [];

  /**
   * Enabled on server
   */

  Integration.server();

  /**
   * Create error with `msg`.
   *
   * @param {String} msg
   * @param {...} args
   * @return {Error}
   * @api public
   */

  Integration.error =
  Integration.prototype.error = function(){
    var msg = fmt.apply(null, arguments);
    // TODO: cache and add .request and .response to ctx.
    var ctx = {};
    return new errors.BadRequestError(msg, name, ctx);
  };

  /**
   * Create validation error with `reason`.
   *
   * @param {String} reason
   * @param {...} args
   * @return {Error}
   * @api public
   */

  Integration.invalid =
  Integration.prototype.invalid = function(){
    var msg = fmt.apply(null, arguments);
    return new errors.ValidationError(msg, name);
  };

  /**
   * Reject a message with `reason`.
   *
   * @param {String} reason
   * @param {...} args
   * @return {Error}
   * @api public
   */

  Integration.reject =
  Integration.prototype.reject = function(){
    var msg = fmt.apply(null, arguments);
    return new errors.RejectedError(msg, name);
  };

  /**
   * Set a default timeout
   */

  Integration.timeout('10s');

  return Integration;
};

/**
 * Merge `a`, `b`.
 *
 * @param {Object} a
 * @param {Object} b
 * @api private
 */

function merge(a, b){
  for (var k in b) a[k] = b[k];
}
