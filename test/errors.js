
var ValidationError = require('../lib/errors').Validation;
var BadRequest = require('../lib/errors').BadRequest;
var integration = require('..');
var assert = require('assert');

describe('errors', function(){
  describe('BadRequest', function(){
    it('should expose .stack', function(){
      var err = new BadRequest('error', 'Segment', { status: 400, body: 'body' });
      assert.equal('error', err.message);
      assert.equal('BAD_REQUEST', err.code);
      assert.equal('Segment', err.integration);
      assert.equal(400, err.status);
      assert.equal('body', err.body);
      assert.equal('string', typeof err.stack);
    });

    it('should not error without context', function(){
      var err = new BadRequest('error', 'Segment');
    });
  });

  describe('ValidationError', function(){
    it('should expose .stack', function(){
      var err = new ValidationError('.key is required');
      assert.equal('INVALID_SETTINGS', err.code);
      assert.equal('.key is required', err.message);
    });
  });

  describe('.error("validation", msg, ctx)', function(){
    it('should return new validation error', function(){
      var Segment = integration('Segment');
      var err = Segment.error('validation', 'message', {});
      assert.equal('INVALID_SETTINGS', err.code);
      assert.equal('Segment: message', err.message);
      assert.equal('Segment', err.integration);
      assert.deepEqual({}, err.ctx);
    });
  });

  describe('.error("bad-request", msg, ctx)', function(){
    var Segment = integration('Segment');
    var ctx = { status: 400, body: 'bad input' };
    var err = Segment.error('bad-request', 'message', ctx);
    assert.equal('BAD_REQUEST', err.code);
    assert.equal('Segment: message', err.message);
    assert.equal('Segment', err.integration);
    assert.deepEqual(err.ctx, ctx);
  });
});
