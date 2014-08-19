
var Track = require('segmentio-facade').Track;
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

  it('should accept fucntions instead of meta', function(){
    var Segment = integration('Segment');
    var conf = {};
    var message = new Track({});
    var called;

    Segment.option('token', function(msg, settings){
      assert.equal(msg, message);
      assert.equal(settings, conf);
      called = true;
      if ('track' != msg.type()) return;
      if (settings.token) return;
      return this.error('validation', '.token is required for track calls', {
        settings: settings,
        message: msg
      });
    });

    var err = Segment.validate(message, conf);
    assert.equal('Segment: .token is required for track calls', err.message);

    conf.token = 'token';
    var err = Segment.validate(message, conf);
    assert.equal(null, err);

    assert(true == called);
  });
});
