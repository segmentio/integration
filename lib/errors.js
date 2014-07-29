
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
 * Validation error, when a setting is missing or of the incorrect type.
 *
 * @param {String} message
 */

function IntegrationValidationError(message){
  Error.captureStackTrace(this, IntegrationValidationError);
  Error.call(this);
  this.message = message;
  this.code = 'INVALID_SETTINGS';
}

/**
 * Error for a bad request to the api
 * @param {String} message
 * @param {Number} status    http status code
 * @param {String} body      response body
 */

function BadRequestError(message, status, body) {
  Error.captureStackTrace(this, BadRequestError);
  Error.call(this);
  this.message = message;
  this.status = status;
  this.body = body;
  this.code = 'BAD_REQUEST';
}

/**
 * Inherit `Error`.
 */

inherits(IntegrationValidationError, Error);
inherits(BadRequestError, Error);
