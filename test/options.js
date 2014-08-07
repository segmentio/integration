
var integration = require('..');
var assert = require('assert');

describe('options', function(){
  var Segment;

  beforeEach(function(){
    Segment = integration('Segment')
      .option('token', { required: true })
      .option('option');
  });

  it('should store settings on `.settings`', function(){
    var segment = Segment({ setting: true });
    assert.deepEqual(segment.settings, {
      setting: true
    });
  });

  describe('when required setting is missing', function(){
    it('should return validation error', function(){
      var err = Segment.validate({}, { option: true });
      assert.equal(err.message, 'Segment: missing required setting "token" got settings "{"option":true}"')
    });
  });

  describe('when settings are ok', function(){
    it('should not return an error', function(){
      var err = Segment.validate({}, { token: 'tok' });
      assert.equal(err, null);
    });
  });
});
