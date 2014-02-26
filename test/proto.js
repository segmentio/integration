
var fmt = require('util').format;
var helpers = require('./support');
var request = require('superagent');
var methods = require('methods');
var integration = require('..');
var errors = integration.errors;
var assert = require('assert');

describe('proto', function(){
  var segment;

  beforeEach(function(){
    segment = integration('Segment.io')
      .endpoint('http://httpbin.org')
      .retries(2)
      .mapper({})();
  })

  describe('.enabled(facade, settings)', function(){
    it('should return true for server channel and enabled Segment.io', function(){
      var track = helpers.track({ options: { 'Segment.io': {} } });
      assert(segment.enabled(track));
    })

    it('should return false if channel isnt server', function(){
      var track = helpers.track({ channel: 'mobile' });
      assert(!segment.enabled(track));
    })

    it('should be false if the integration is set to false', function(){
      var track = helpers.track({ options: { 'Segment.io': false }});
      assert(!segment.enabled(track));
    })

    it('should emit `request` before request', function(done){
      var req = segment.request('get', '/get');
      req.end(function(err, res){ done(err, res); });
      segment.on('request', function(request){
        assert(req == request);
      });
    })

    it('should emit `response` after response', function(done){
      var req = segment.request('get', '/get').end();
      segment.on('response', function(res){
        assert('http://httpbin.org/get' == res.body.url);
        done();
      });
    })
  })

  describe('.ensure(value)', function(){
    it('should return validation error if value is empty', function(){
      var err = segment.ensure('', 'userId');
      assert(err instanceof errors.Validation);
      assert('"Test" integration requires "userId"');
    })
  })

  describe('.redis()', function(){
    it('should set / get redis', function(){
      var client = {};
      segment.redis(client);
      assert(client == segment.redis());
    })

    it('should return the integration when setting redis', function(){
      assert(segment == segment.redis({}));
    })
  })

  describe('.logger()', function(){
    it('should set / get logger', function(){
      var logger = {};
      segment.logger(logger);
      assert(logger == segment.logger());
    })

    it('should return the integration when setting logger', function(){
      assert(segment == segment.logger({}));
    })
  })

  describe('.request()', function(){
    it('should return a new superagent request', function(){
      assert(segment.request() instanceof request.Request);
    })

    it('should set the method', function(){
      assert('POST' == segment.request('post').method);
    })

    it('should set the endpoint', function(){
      assert('http://httpbin.org' == segment.request('post').url);
    })

    it('should set redirects to 0', function(){
      assert(0 == segment.request()._redirects);
    })

    it('should allow absolute urls', function(){
      assert('http://baz.com' == segment.request('post', 'http://baz.com').url);
    })
  })

  methods.forEach(function(method){
    var name = 'delete' == method ? 'del' : method;
    if ('search' == method) return;
    describe(fmt('.%s()', name), function(){
      it(fmt('should return %s request', method), function(){
        assert(method.toUpperCase() == segment[name]().method);
      })

      it('should allow absolute urls', function(){
        assert('https://baz.com' == segment[name]('https://baz.com').url);
      })
    })
  })

  describe('.identify(identify, settings, fn)', function(){
    it('should do nothing', function(done){
      segment.identify({}, {}, done);
    })

    it('should map identify if mapper.identify is defined', function(done){
      var test = integration('test').mapper({ identify: mapper() });
      test.prototype.identify = mapper.test(done);
      test().identify({}, {}, done);
    })
  })

  describe('.track(track, settings, fn)', function(){
    it('should do nothing', function(done){
      segment.track({}, {}, done);
    })

    it('should map track if mapper.track is defined', function(done){
      var test = integration('test').mapper({ track: mapper() });
      test.prototype.track = mapper.test(done);
      test().track({}, {}, done);
    })
  })

  describe('.page(page, settings, fn)', function(){
    it('should do nothing', function(done){
      segment.page({}, {}, done);
    })

    it('should map page if mapper.page is defined', function(done){
      var test = integration('test').mapper({ page: mapper() });
      test.prototype.page = mapper.test(done);
      test().page({}, {}, done);
    })
  })

  describe('.screen(screen, settings, fn)', function(){
    it('should do nothing', function(done){
      segment.screen({}, {}, done);
    })

    it('should map screen if mapper.screen is defined', function(done){
      var test = integration('test').mapper({ screen: mapper() });
      test.prototype.screen = mapper.test(done);
      test().screen({}, {}, done);
    })
  })

  describe('.group(group, settings, fn)', function(){
    it('should do nothing', function(done){
      segment.group({}, {}, done);
    })

    it('should map group if mapper.group is defined', function(done){
      var test = integration('test').mapper({ group: mapper() });
      test.prototype.group = mapper.test(done);
      test().group({}, {}, done);
    })
  })
})

/**
 * Default mapper.
 *
 * @return {Function}
 */

function mapper(){
  return function(_){
    return { mapped: true };
  };
}

/**
 * Mapper test.
 */

mapper.test = function(done){
  return function(message, settings){
    assert(message.mapped);
    assert(settings);
    done();
  };
};
