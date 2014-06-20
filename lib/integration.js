
/**
 * Module dependencies.
 */

var Emitter = require('events').EventEmitter;
var wrapMethods = require('./wrap-methods');
var addEcommerce = require('./ecommerce');
var inherit = require('util').inherits;
var slug = require('slug-component');
var statics = require('./statics');
var errors = require('./errors');
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

  function Integration(){
    if (!(this instanceof Integration)) return new Integration;
    this.debug = debug('segmentio:integration:' + slug(name));
    Emitter.call(this);
    this.name = name;
    this.initialize();
    wrapMethods(this);
    addEcommerce(this);
  }

  /**
   * Inherit.
   */

  inherit(Integration, Emitter);
  merge(Integration.prototype, proto);
  merge(Integration, statics);

  /**
   * Enabled on server
   */

  Integration.server();

  /**
   * Set a default timeout
   */

  Integration.timeout(ms('10s'));

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
