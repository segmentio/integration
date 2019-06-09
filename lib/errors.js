
/**
 * Module dependencies.
 */

var inherits = require('util').inherits

/**
 * Expose errors.
 */

exports.ValidationError = IntegrationValidationError
exports.ResourceLockedError = ResourceLockedError
exports.RejectedError = MessageRejectedError
exports.BadRequestError = BadRequestError

/**
 * Validation error, when a setting is missing or of the incorrect type.
 *
 * @param {String} message
 * @param {String} integration
 * @param {Object} ctx
 */

function IntegrationValidationError (message, integration) {
  Error.captureStackTrace(this, IntegrationValidationError)
  Error.call(this)
  this.integration = integration
  this.message = message
  this.code = 'INVALID_SETTINGS'
  this.status = 400
}

/**
 * Error for a bad request to the api
 *
 * @param {String} message
 * @param {String} integration
 * @param {Object} ctx
 */

function BadRequestError (message, integration, ctx) {
  Error.captureStackTrace(this, BadRequestError)
  Error.call(this)
  ctx = ctx || {}
  this.message = message
  this.integration = integration
  this.status = ctx.status
  this.body = ctx.body
  this.code = 'BAD_REQUEST'
}

/**
 * Message rejected error.
 *
 * @param {String} message
 * @param {Stirng} integration
 */

function MessageRejectedError (message, integration) {
  Error.captureStackTrace(this, MessageRejectedError)
  Error.call(this)
  this.message = message
  this.integration = integration
  this.code = 'MESSAGE_REJECTED'
  this.status = 400
}

/**
 * Resource locked error.
 *
 * @param {String} message
 * @param {Stirng} integration
 */

function ResourceLockedError (message, integration) {
  Error.captureStackTrace(this, ResourceLockedError)
  Error.call(this)
  this.message = message
  this.integration = integration
  this.code = 'RESOURCE_LOCKED'
}

/**
 * Inherit `Error`.
 */

inherits(IntegrationValidationError, Error)
inherits(MessageRejectedError, Error)
inherits(ResourceLockedError, Error)
inherits(BadRequestError, Error)
