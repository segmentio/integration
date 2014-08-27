
/**
 * Module dependencies.
 */

var inherits = require('util').inherits;

/**
 * Expose errors.
 */

exports.Validation = IntegrationValidationError;
exports.BadRequest = BadRequestError;

/**
 * Expose error types.
 */

exports.types = {
  'validation': IntegrationValidationError,
  'bad-request': BadRequestError,
  'reject': MessageRejectedError
};

/**
 * Validation error, when a setting is missing or of the incorrect type.
 *
 * @param {String} message
 * @param {String} integration
 * @param {Object} ctx
 */

function IntegrationValidationError(message, integration, ctx){
  Error.captureStackTrace(this, IntegrationValidationError);
  Error.call(this);
  this.integration = integration;
  this.message = message;
  this.settings = ctx;
  this.code = 'INVALID_SETTINGS';
}

/**
 * Error for a bad request to the api
 *
 * @param {String} message
 * @param {String} integration
 * @param {Object} ctx
 */

function BadRequestError(message, integration, ctx) {
  Error.captureStackTrace(this, BadRequestError);
  Error.call(this);
  var ctx = ctx || {};
  this.message = message;
  this.integration = integration;
  this.status = ctx.status;
  this.body = ctx.body;
  this.code = 'BAD_REQUEST';
}

/**
 * Message rejected error.
 *
 * @param {String} message
 * @param {Stirng} integration
 */

function MessageRejectedError(message, integration){
  Error.captureStackTrace(this, MessageRejectedError);
  Error.call(this);
  this.message = message;
  this.integration = integration;
  this.code = 'MESSAGE_REJECTED';
}

/**
 * Inherit `Error`.
 */

inherits(IntegrationValidationError, Error);
inherits(MessageRejectedError, Error);
inherits(BadRequestError, Error);
