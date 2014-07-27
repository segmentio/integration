
var ValidationError = require('../lib/errors').Validation;
var BadRequest = require('../lib/errors').BadRequest;
var assert = require('assert');


describe('errors', function(){
  describe('BadRequest', function(){
    it('should expose .stack', function(){
      var err = new BadRequest('error', 400, 'body');
      assert.equal('error', err.message);
      assert.equal('BAD_REQUEST', err.code);
      assert.equal(400, err.status);
      assert.equal('body', err.body);
      assert.equal('string', typeof err.stack);
    });
  });

  describe('ValidationError', function(){
    it('should expose .stack', function(){
      var err = new ValidationError('.key is required');
      assert.equal('INVALID_SETTINGS', err.code);
      assert.equal('.key is required', err.message);
    });
  });
});
