
var fmt = require('util').format;
var helpers = require('./support');
var request = require('superagent');
var methods = require('methods');
var integration = require('..');
var errors = integration.errors;
var assert = require('assert');
var http = require('http');

describe('proto', function(){
  var segment;
  var server;

  before(function(done){
    server = http.createServer(function(req, res){
      res.writeHead(200, {});
      res.end();
    });
    server.listen(done);
  });

  after(function(){
    server.close();
  });

  beforeEach(function(){
    segment = integration('Segment.io')
      .endpoint('http://localhost:' + server.address().port)
      .retries(2)
      .mapper({})
      ();
  })

  describe('#map', function(){
    describe('when `map` is not an object or array', function(){
      it('should return an empty array', function(){
        assert.deepEqual([], segment.map(0, ''));
        assert.deepEqual([], segment.map('', ''));
        assert.deepEqual([], segment.map(null, ''));
        assert.deepEqual([], segment.map(Number, ''));
      })
    })

    describe('when `map` is an object', function(){
      it('should return an empty array on mismatch', function(){
        var map = { a: '4be41523', b: 'd49ccea' };
        assert.deepEqual([], segment.map(map, 'c'));
      })

      it('should return an array with the value on match', function(){
        var map = { a: '48dc32b2', b: '48dc32b2' };
        assert.deepEqual(['48dc32b2'], segment.map(map, 'b'));
      })

      it('should use to-no-case to match keys', function(){
        var map = { 'My Event': '7b4fe803', 'other event': '2107007a' };
        assert.deepEqual(['7b4fe803'], segment.map(map, 'my_event'));
      })
    })

    describe('when .options.events is an array', function(){
      it('should return an empty array if the array isnt a map', function(){
        var map = ['one', 'two'];
        assert.deepEqual([], segment.map(map, 'one'));
      })

      it('should return an empty array when the array is empty', function(){
        var map = [];
        assert.deepEqual([], segment.map(map, 'wee'));
      })

      it('should return an empty array on mismatch', function(){
        var map = [{ key: 'my event', value: '1121f10f' }];
        assert.deepEqual([], segment.map(map, 'event'));
      })

      it('should return all matches in the array', function(){
        var map = [{ key: 'baz', value: '4cff6219' }, { key: 'baz', value: '4426d54'} ];
        assert.deepEqual(['4cff6219', '4426d54'], segment.map(map, 'baz'));
      })

      it('should use to-no-case to match keys', function(){
        var map = [{ key: 'My Event', value: 'a35bd696' }];
        assert.deepEqual(['a35bd696'], segment.map(map, 'my_event'));
      })
    })
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
  })

  describe('.ensure(value)', function(){
    it('should return validation error if value is empty', function(){
      var err = segment.ensure('', 'userId');
      assert(err instanceof errors.Validation);
      assert(err.message == '"Segment.io" integration requires "userId"');
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
      var req = segment.request('post');
      assert.equal('POST', req.method);
      req.abort();
      req.end(function(){});
    })

    it('should set the endpoint', function(){
      var port = server.address().port;
      var req = segment.request('post');
      assert.equal('http://localhost:' + port, req.url);
      req.abort();
      req.end(function(){});
    })

    it('should set redirects to 0', function(){
      var req = segment.request();
      assert.equal(0, req._redirects);
      req.abort();
      req.end(function(){});
    })

    it('should allow absolute urls', function(){
      var req = segment.request('post', 'http://baz.com');
      assert.equal('http://baz.com', req.url);
      req.abort();
      req.end(function(){});
    })

    it('should set the user-agent', function(){
      var req = segment.request('post');
      var header = req.req._headers;
      assert.equal('Segment.io/1.0', header['user-agent']);
      req.abort();
      req.end(function(){});
    });

    it('should be able to override the default user agent', function(){
      var req = segment.request('post');
      var header = req.req._headers;
      assert.equal('Segment.io/1.0', header['user-agent']);
      req.set('User-Agent', 'some-agent');
      assert.equal('some-agent', header['user-agent']);
      req.abort();
      req.end(function(){});
    });

    it('should emit `request` before request', function(done){
      var req = segment.request('get', '/get');
      req.end(function(err, res){ done(err, res); });
      segment.on('request', function(request){
        assert(req == request);
      });
    })

    it('should emit `response` after response', function(done){
      var req = segment.request('get', '/get').end(function(){});
      segment.on('response', function(res){
        assert(res.body);
        done();
      });
    })

    describe('.end()', function(){
      it('should return the superagent request', function(){
        assert(segment.request('post').end() instanceof request.Request);
      });
    });
  })

  methods.forEach(function(method){
    var name = 'delete' == method ? 'del' : method;
    if ('search' == method) return;
    if ('lock' == method) return;

    describe(fmt('.%s()', name), function(){
      it(fmt('should return %s request', method), function(){
        var req = segment[name]();
        assert.equal(method.toUpperCase(), req.method);
        req.abort();
        req.end(function(){});
      })

      it('should allow absolute urls', function(){
        var req = segment[name]('http://baz.com');
        assert.equal('http://baz.com', req.url);
        req.abort();
        req.end(function(){});
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

    it('should call the mapper with the correct context', function(){
      var Test = integration('test').mapper({ track: track });
      Test.prototype.track = function(){};
      var test = Test();
      test.track(helpers.track());
      var ctx;

      function track(){
        ctx = this;
      }

      assert(ctx == test);
    });
  })

  describe('.track(track, settings, fn)', function(){
    it('should do nothing', function(done){
      var msg = helpers.track();
      segment.track(msg, {}, done);
    })

    it('should map track if mapper.track is defined', function(done){
      var test = integration('test').mapper({ track: mapper() });
      test.prototype.track = mapper.test(done);
      var msg = helpers.track();
      test().track(msg, {}, done);
    })

    it('should call .viewedProduct when the event is /viewed[ _]?product/i', function(){
      var track = helpers.track;
      segment.viewedProduct = spy();
      segment.track(track({ event: 'Viewed Product' }));
      segment.track(track({ event: 'viewed product' }));
      segment.track(track({ event: 'viewed_product' }));
      segment.track(track({ event: 'viewedProduct' }));
      var args = segment.viewedProduct.args;
      assert.equal(4, args.length);
      assert.equal('Viewed Product', args[0][0].event());
      assert.equal('viewed product', args[1][0].event());
      assert.equal('viewed_product', args[2][0].event());
      assert.equal('viewedProduct', args[3][0].event());
    })

    it('should call .addedProduct when the event is /added[ _]?product/i', function(){
      var track = helpers.track;
      segment.addedProduct = spy();
      segment.track(track({ event: 'Added Product' }));
      segment.track(track({ event: 'added product' }));
      segment.track(track({ event: 'added_product' }));
      segment.track(track({ event: 'addedProduct' }));
      var args = segment.addedProduct.args;
      assert.equal(4, args.length);
      assert.equal('Added Product', args[0][0].event());
      assert.equal('added product', args[1][0].event());
      assert.equal('added_product', args[2][0].event());
      assert.equal('addedProduct', args[3][0].event());
    })

    it('should call .removedProduct when the event is /removed[ _]?product/i', function(){
      var track = helpers.track;
      segment.removedProduct = spy();
      segment.track(track({ event: 'Removed Product' }));
      segment.track(track({ event: 'removed product' }));
      segment.track(track({ event: 'removed_product' }));
      segment.track(track({ event: 'removedProduct' }));
      var args = segment.removedProduct.args;
      assert.equal(4, args.length);
      assert.equal('Removed Product', args[0][0].event());
      assert.equal('removed product', args[1][0].event());
      assert.equal('removed_product', args[2][0].event());
      assert.equal('removedProduct', args[3][0].event());
    })

    it('should call .completedOrder when the event is /removed[ _]?product/i', function(){
      var track = helpers.track;
      segment.completedOrder = spy();
      segment.track(track({ event: 'Completed Order' }));
      segment.track(track({ event: 'completed order' }));
      segment.track(track({ event: 'completed_order' }));
      segment.track(track({ event: 'completedOrder' }));
      var args = segment.completedOrder.args;
      assert.equal(4, args.length);
      assert.equal('Completed Order', args[0][0].event());
      assert.equal('completed order', args[1][0].event());
      assert.equal('completed_order', args[2][0].event());
      assert.equal('completedOrder', args[3][0].event());
    })

    it('should not call .track if a method is found', function(){
      var msg = helpers.track({ event: 'Completed Order' });
      var Test = integration('test');
      Test.prototype.track = spy();
      Test.prototype.completedOrder = spy();
      var test = Test();
      test.track(msg);
      assert.equal(0, Test.prototype.track.args.length);
      assert.equal(1, Test.prototype.completedOrder.args.length);
    })

    it('should apply arguments to methods', function(done){
      var msg = helpers.track({ event: 'Completed Order' });
      var settings = {};
      segment.completedOrder = spy();
      segment.track(msg, settings, done);
      var args = segment.completedOrder.args[0];
      assert.deepEqual(args, [msg, settings, done]);
      done();
    })

    it('should not error if a method is not implemented and fallback to track', function(){
      var msg = helpers.track({ event: 'Completed Order' });
      var Test = integration('test');
      Test.prototype.track = spy();
      Test.prototype.completedOrder = null;
      var test = Test();
      test.track(msg);
      assert.equal(1, Test.prototype.track.args.length);
    })

    it('should return the value', function(){
      var msg = helpers.track({ event: 'Completed Order' });
      var Test = integration('test');
      Test.prototype.completedOrder = function(){ return 1; };
      var test = Test();
      assert.equal(1, test.track(msg));
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

/**
 * spy
 */

function spy(){
  var args = [];
  push.args = args;
  return push;

  function push(){
    push.args.push([].slice.call(arguments));
  }
}
