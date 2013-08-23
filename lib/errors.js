
var util = require('util');


/**
 * Module exports
 */

exports.Validation = IntegrationValidationError;
exports.BadRequest = BadRequestError;


/**
 * Validation error, when a setting is missing or of the incorrect type
 */

function IntegrationValidationError (message) {
  Error.call(this);
  this.message = message;
  this.code = 'INVALID_SETTINGS';
}


util.inherits(IntegrationValidationError, Error);


/**
 * Error for a bad request to the api
 * @param {String} message
 * @param {Number} status    http status code
 * @param {String} body      response body
 */

function BadRequestError(message, status, body) {
  Error.call(this);
  this.message = message;
  this.status = status;
  this.body = body;
  this.code = 'BAD_REQUEST';
}


util.inherits(BadRequestError, Error);