
var Track = require('segmentio-facade').Track;
var integration = require('..');
var assert = require('assert');

describe('validations', function(){
  var Segment;

  beforeEach(function(){
    Segment = integration('Segment');
  });

  describe('empty', function(){
    it('should not return any errors', function(){
      assert(null == Segment.validate({}, {}));
    });
  });

  describe('settings.apiKey', function(){
    beforeEach(function(){
      Segment.ensure('settings.apiKey');
    })

    it('should add validation correctly', function(){
      var all = Segment.validations;
      assert.equal(1, all.length);
      assert.equal('settings', all[0].type);
      assert.equal('apiKey', all[0].path);
    });

    it('should error if missing', function(){
      var err = Segment.validate({}, {});
      assert.equal('Segment', err.integration);
      assert.equal('Segment: setting "apiKey" is required', err.message);
    });

    it('should not error if given', function(){
      var err = Segment.validate({}, { apiKey: 'key' });
      assert(null == err);
    });
  });

  describe('message.userId', function(){
    beforeEach(function(){
      Segment.ensure('message.userId');
    });

    it('should error if missing', function(){
      var msg = new Track({});
      var err = Segment.validate(msg);
      assert.equal('Segment', err.integration);
      assert.equal('Segment: message attribute "userId" is required', err.message);
    });

    it('should not error if given', function(){
      var msg = new Track({ userId: 0 });
      var err = Segment.validate(msg);
      assert(null == err);
    });
  });

  describe('message.context.some_attr', function(){
    beforeEach(function(){
      Segment.ensure('message.context.some_attr');
    });

    it('should error if its missing', function(){
      var msg = new Track({});
      var err = Segment.validate(msg);
      assert.equal('Segment', err.integration);
      assert.equal('Segment: message attribute "context.some_attr" is required', err.message);
    });

    it('should not error if given', function(){
      var msg = new Track({ context: { some_attr: 'some-attr' } });
      var err = Segment.validate(msg);
      assert(null == err);
    });

    it('should use .proxy()', function(){
      var msg = new Track({ context: { SomeAttr: 'some-attr' } });
      var err = Segment.validate(msg);
      assert(null == err);
    });
  });

  describe('fn(msg, settings)', function(){
    var args;
    var ctx;

    beforeEach(function(){
      args = [];
      Segment.ensure(function(msg, settings){
        ctx = this;
        args.push(arguments);
      });
    });

    it('should call fn with msg, settings', function(){
      var msg = new Track({});
      var settings = {};
      Segment.validate(msg, settings);
      assert.equal(args[0][0], msg);
      assert.equal(args[0][1], settings);
    });

    it('should call fn with Integration context', function(){
      var msg = new Track({});
      var settings = {};
      Segment.validate(msg, settings);
      assert.equal(ctx, Segment);
    });
  });
});
