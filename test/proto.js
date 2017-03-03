
var Page = require('segmentio-facade').Page;
var Screen = require('segmentio-facade').Screen;
var fmt = require('util').format;
var helpers = require('./support');
var request = require('superagent');
var methods = require('methods');
var integration = require('..');
var errors = integration.errors;
var assert = require('assert');
var http = require('http');

describe('proto', function(){
  var Segment;
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
    Segment = integration('Segment.io')
      .endpoint('http://localhost:' + server.address().port)
      .mapper({});

    Segment.prototype.page = tick;
    Segment.prototype.track = tick;
    Segment.prototype.alias = tick;
    Segment.prototype.group = tick;
    Segment.prototype.screen = tick;
    Segment.prototype.identify = tick;

    segment = new Segment({});
  });

  describe('()', function(){
    it('should call #initialize', function(){
      var s = Segment.prototype.initialize = spy();
      Segment();
      assert.equal(1, s.args.length);
    });

    it('should call #wrapMethods() after #initialize', function(){
      var track = spy();
      Segment.prototype.track = track;
      Segment.prototype.initialize = function(){ assert(track == this.track); };
      var s = Segment();
      assert(track != s.track);
    });
  });

  describe('#slug', function(){
    it('should return the `name` in "slug" format', function(){
      assert.equal('segmentio', segment.slug());
    });
  });

  describe('#map', function(){
    describe('when `map` is not an object or array', function(){
      it('should return an empty array', function(){
        assert.deepEqual([], segment.map(0, ''));
        assert.deepEqual([], segment.map('', ''));
        assert.deepEqual([], segment.map(null, ''));
        assert.deepEqual([], segment.map(Number, ''));
      });
    });

    describe('when `map` is an object', function(){
      it('should return an empty array on mismatch', function(){
        var map = { a: '4be41523', b: 'd49ccea' };
        assert.deepEqual([], segment.map(map, 'c'));
      });

      it('should return an array with the value on match', function(){
        var map = { a: '48dc32b2', b: '48dc32b2' };
        assert.deepEqual(['48dc32b2'], segment.map(map, 'b'));
      });

      it('should use to-no-case to match keys', function(){
        var map = { 'My Event': '7b4fe803', 'other event': '2107007a' };
        assert.deepEqual(['7b4fe803'], segment.map(map, 'my_event'));
      });
    });

    describe('when .options.events is an array', function(){
      it('should return an empty array if the array isnt a map', function(){
        var map = ['one', 'two'];
        assert.deepEqual([], segment.map(map, 'one'));
      });

      it('should return an empty array when the array is empty', function(){
        var map = [];
        assert.deepEqual([], segment.map(map, 'wee'));
      });

      it('should return an empty array on mismatch', function(){
        var map = [{ key: 'my event', value: '1121f10f' }];
        assert.deepEqual([], segment.map(map, 'event'));
      });

      it('should return all matches in the array', function(){
        var map = [
          { key: 'baz', value: '4cff6219' },
          { key: 'baz', value: '4426d54' }
        ];
        assert.deepEqual(['4cff6219', '4426d54'], segment.map(map, 'baz'));
      });

      it('should use to-no-case to match keys', function(){
        var map = [{ key: 'My Event', value: 'a35bd696' }];
        assert.deepEqual(['a35bd696'], segment.map(map, 'my_event'));
      });
    });
  });

  describe('.jstrace()', function(){
    it('should return noop', function(){
      var fn = segment.jstrace();
      assert.equal(fn.toString(), (function noop(){}).toString());
    });

    it('should set ._trace', function(){
      var t = function(){};
      segment.jstrace(t);
      assert.equal(t, segment._trace);
    });

    it('should get ._trace', function(){
      var t = function(){};
      segment.jstrace(t);
      assert.equal(t, segment.jstrace());
    });
  });

  describe('.trace()', function(){
    it('should call .jstrace()()', function(done){
      var t = function(){
        var args = [].slice.call(arguments);
        assert.deepEqual(args, ['user:create', { id: 'user-id' }]);
        done();
      };

      segment.jstrace(t);
      segment.trace('user:create', { id: 'user-id' });
    });

    it('should not throw when .jstrace() is not set', function(){
      segment.trace('user:create', { id: 'user-id' });
    });
  });

  describe('.redis()', function(){
    it('should set / get redis', function(){
      var client = {};
      segment.redis(client);
      assert(client == segment.redis());
    });

    it('should return the integration when setting redis', function(){
      assert(segment == segment.redis({}));
    });
  });

  describe('.logger()', function(){
    it('should set / get logger', function(){
      var logger = {};
      segment.logger(logger);
      assert(logger == segment.logger());
    });

    it('should return the integration when setting logger', function(){
      assert(segment == segment.logger({}));
    });
  });

  describe('.request()', function(){
    it('should return a new superagent request', function(){
      assert(segment.request() instanceof request.Request);
    });

    it('should set the method', function(){
      var req = segment.request('post');
      assert.equal('POST', req.method);
      req.abort();
      req.end(function(){});
    });

    it('should set the endpoint', function(){
      var port = server.address().port;
      var req = segment.request('post');
      assert.equal('http://localhost:' + port, req.url);
      req.abort();
      req.end(function(){});
    });

    it('should set redirects to 0', function(){
      var req = segment.request();
      assert.equal(0, req._redirects);
      req.abort();
      req.end(function(){});
    });

    it('should allow absolute urls', function(){
      var req = segment.request('post', 'http://baz.com');
      assert.equal('http://baz.com', req.url);
      req.abort();
      req.end(function(){});
    });

    it('should set the user-agent', function(){
      var req = segment.request('post');
      assert.equal(req.header['User-Agent'], 'Segment.io/1.0');
      req.abort();
      req.end(function(){});
    });

    it('should set the Accept-Encoding header', function(){
      var req = segment.request('post');
      assert.equal(req.header['Accept-Encoding'], 'identity');
      req.abort();
      req.end(function(){});
    });

    it('should be able to override the default user agent', function(){
      var req = segment.request('post');
      assert.equal(req.header['User-Agent'], 'Segment.io/1.0');
      req.set('User-Agent', 'some-agent');
      assert.equal(req.header['User-Agent'], 'some-agent');
      req.abort();
      req.end(function(){});
    });

    it('should emit `request` before request', function(done){
      var req = segment.request('get', '/get');
      req.end(function(err, res){ done(err, res); });
      segment.on('request', function(request){
        assert(req == request);
      });
    });

    it('should emit `response` after response', function(done){
      var req = segment.request('get', '/get').end(function(){});
      segment.on('response', function(res){
        assert(res);
        assert(res.header);
        assert(res.request.url);
        assert(res.request.qs);
        assert(res.request);
        assert(res.body);
        done();
      });
    });

    describe('.end()', function(){
      it('should return the superagent request', function(){
        assert(segment.request('post').end() instanceof request.Request);
      });
    });
  });

  methods.forEach(function(method){
    var name = 'delete' == method ? 'del' : method;
    if ('search' == method) return;
    if ('trace' == method) return;
    if ('lock' == method) return;
    if ('unlock' == method) return;
    describe(fmt('.%s()', name), function(){
      it(fmt('should return %s request', method), function(){
        var req = segment[name]();
        assert.equal(method.toUpperCase(), req.method);
        req.abort();
        req.end(function(){});
      });

      it('should allow absolute urls', function(){
        var req = segment[name]('http://baz.com');
        assert.equal('http://baz.com', req.url);
        req.abort();
        req.end(function(){});
      });
    });
  });

  describe('.identify(identify, fn)', function(){
    it('should map identify if mapper.identify is defined', function(done){
      var test = integration('test').mapper({ identify: mapper() });
      test.prototype.identify = mapper.test(done);
      test({}).identify({}, done);
    });

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
  });

  describe('.track(track, fn)', function(){
    it('should map track if mapper.track is defined', function(done){
      var test = integration('test').mapper({ track: mapper() });
      test.prototype.track = mapper.test(done);
      var msg = helpers.track();
      test({}).track(msg, done);
    });

    it('should call .productViewed when the event is /viewed[ _]?product/i', function(){
      var track = helpers.track;
      segment.productViewed = spy();
      segment.track(track({ event: 'Viewed Product' }));
      segment.track(track({ event: 'viewed product' }));
      segment.track(track({ event: 'viewed_product' }));
      segment.track(track({ event: 'viewedProduct' }));
      var args = segment.productViewed.args;
      assert.equal(4, args.length);
      assert.equal('Viewed Product', args[0][0].event());
      assert.equal('viewed product', args[1][0].event());
      assert.equal('viewed_product', args[2][0].event());
      assert.equal('viewedProduct', args[3][0].event());
    });

    it('should call .productViewed when the event is /product[ _]?viewed/i', function(){
      var track = helpers.track;
      segment.productViewed = spy();
      segment.track(track({ event: 'Product Viewed' }));
      segment.track(track({ event: 'product viewed' }));
      segment.track(track({ event: 'product_viewed' }));
      segment.track(track({ event: 'productViewed' }));
      var args = segment.productViewed.args;
      assert.equal(4, args.length);
      assert.equal('Product Viewed', args[0][0].event());
      assert.equal('product viewed', args[1][0].event());
      assert.equal('product_viewed', args[2][0].event());
      assert.equal('productViewed', args[3][0].event());
    });

    it('should call .productAdded when the event is /added[ _]?product/i', function(){
      var track = helpers.track;
      segment.productAdded = spy();
      segment.track(track({ event: 'Added Product' }));
      segment.track(track({ event: 'added product' }));
      segment.track(track({ event: 'added_product' }));
      segment.track(track({ event: 'addedProduct' }));
      var args = segment.productAdded.args;
      assert.equal(4, args.length);
      assert.equal('Added Product', args[0][0].event());
      assert.equal('added product', args[1][0].event());
      assert.equal('added_product', args[2][0].event());
      assert.equal('addedProduct', args[3][0].event());
    });

    it('should call .productAdded when the event is /product[ _]?added/i', function(){
      var track = helpers.track;
      segment.productAdded = spy();
      segment.track(track({ event: 'Product Added' }));
      segment.track(track({ event: 'product added' }));
      segment.track(track({ event: 'product_added' }));
      segment.track(track({ event: 'productAdded' }));
      var args = segment.productAdded.args;
      assert.equal(4, args.length);
      assert.equal('Product Added', args[0][0].event());
      assert.equal('product added', args[1][0].event());
      assert.equal('product_added', args[2][0].event());
      assert.equal('productAdded', args[3][0].event());
    });

    it('should call .productRemoved when the event is /removed[ _]?product/i', function(){
      var track = helpers.track;
      segment.productRemoved = spy();
      segment.track(track({ event: 'Removed Product' }));
      segment.track(track({ event: 'removed product' }));
      segment.track(track({ event: 'removed_product' }));
      segment.track(track({ event: 'removedProduct' }));
      var args = segment.productRemoved.args;
      assert.equal(4, args.length);
      assert.equal('Removed Product', args[0][0].event());
      assert.equal('removed product', args[1][0].event());
      assert.equal('removed_product', args[2][0].event());
      assert.equal('removedProduct', args[3][0].event());
    });

    it('should call .orderCompleted when the event is /completed[ _]?order/i', function(){
      var track = helpers.track;
      segment.orderCompleted = spy();
      segment.track(track({ event: 'Completed Order' }));
      segment.track(track({ event: 'completed order' }));
      segment.track(track({ event: 'completed_order' }));
      segment.track(track({ event: 'completedOrder' }));
      var args = segment.orderCompleted.args;
      assert.equal(4, args.length);
      assert.equal('Completed Order', args[0][0].event());
      assert.equal('completed order', args[1][0].event());
      assert.equal('completed_order', args[2][0].event());
      assert.equal('completedOrder', args[3][0].event());
    });

    it('should call .orderCompleted when the event is /order[ _]?completed/i', function(){
      var track = helpers.track;
      segment.orderCompleted = spy();
      segment.track(track({ event: 'Order Completed' }));
      segment.track(track({ event: 'order completed' }));
      segment.track(track({ event: 'order_completed' }));
      segment.track(track({ event: 'orderCompleted' }));
      var args = segment.orderCompleted.args;
      assert.equal(4, args.length);
      assert.equal('Order Completed', args[0][0].event());
      assert.equal('order completed', args[1][0].event());
      assert.equal('order_completed', args[2][0].event());
      assert.equal('orderCompleted', args[3][0].event());
    });

    it('should not call .track if a method is found', function(){
      var msg = helpers.track({ event: 'Order Completed' });
      var Test = integration('test');
      Test.prototype.track = spy();
      Test.prototype.orderCompleted = spy();
      var test = Test();
      test.track(msg);
      assert.equal(0, Test.prototype.track.args.length);
      assert.equal(1, Test.prototype.orderCompleted.args.length);
    });

    it('should apply arguments to methods', function(done){
      var msg = helpers.track({ event: 'Order Completed' });
      var settings = {};
      segment.orderCompleted = spy();
      segment.track(msg, done);
      var args = segment.orderCompleted.args[0];
      assert.deepEqual(args, [msg, done]);
      done();
    });

    it('should not error if a method is not implemented and fallback to track', function(){
      var msg = helpers.track({ event: 'Order Completed' });
      var Test = integration('test');
      Test.prototype.track = spy();
      Test.prototype.orderCompleted = null;
      var test = Test();
      test.track(msg);
      assert.equal(1, Test.prototype.track.args.length);
    });

    it('should return the value', function(){
      var msg = helpers.track({ event: 'Order Completed' });
      var Test = integration('test');
      Test.prototype.orderCompleted = function(){ return 1; };
      Test.prototype.track = tick;
      var test = Test();
      assert.equal(1, test.track(msg));
    });
  });

  describe('.page(page, fn)', function(){
    var page;
    var tracks;

    beforeEach(function(){
      var Segment = integration('Segment');
      Segment.mapToTrack(['page']);
      tracks = [];
      segment = new Segment({});
      segment.track = function(msg, done){
        tracks.push(msg);
        setImmediate(done);
      };
    });

    beforeEach(function(){
      page = new Page({
        userId: 'user-id',
        anonymousId: 'anonymous-id',
        name: 'Integration',
        category: 'Docs',
        properties: {
          url: 'segment.com/docs/page'
        },
        context: {
          ip: '0.0.0.0'
        }
      });
    });

    it('should map page if mapper.page is defined', function(done){
      var test = integration('test').mapper({ page: mapper() });
      test.prototype.page = mapper.test(done);
      test().page({}, done);
    });

    it('should map page if mapper.screen is defined', function(done){
      var test = integration('test').mapper({ screen: mapper() });
      test.prototype.page = mapper.test(done);
      test().page({}, done);
    });

    it('should send "Loaded a Page" if .trackAllPages is true', function(done){
      segment.settings.trackAllPages = true;
      segment.page(page, function(err){
        if (err) return done(err);
        var msg = tracks[0];
        assert.equal(tracks.length, 1);
        assert.equal(msg.userId(), 'user-id');
        assert.equal(msg.anonymousId(), 'anonymous-id');
        assert.deepEqual(msg.context(), { ip: '0.0.0.0' });
        assert.deepEqual(msg.event(), 'Loaded a Page');
        assert.deepEqual(msg.properties(), {
          url: 'segment.com/docs/page',
          category: 'Docs',
          name: 'Integration'
        });
        done();
      });
    });

    it('should send "Viewed Docs Page" if .trackCategorizedPages is true', function(done){
      segment.settings.trackCategorizedPages = true;
      segment.page(page, function(err){
        if (err) return done(err);
        var msg = tracks[0];
        assert.equal(tracks.length, 1);
        assert.equal(msg.userId(), 'user-id');
        assert.equal(msg.anonymousId(), 'anonymous-id');
        assert.deepEqual(msg.context(), { ip: '0.0.0.0' });
        assert.deepEqual(msg.event(), 'Viewed Docs Page');
        assert.deepEqual(msg.properties(), {
          url: 'segment.com/docs/page',
          category: 'Docs',
          name: 'Integration'
        });
        done();
      });
    });

    it('should send "Viewed Docs Integration Page" if .trackNamedPages is true', function(done){
      segment.settings.trackNamedPages = true;
      segment.page(page, function(err){
        if (err) return done(err);
        var msg = tracks[0];
        assert.equal(tracks.length, 1);
        assert.equal(msg.userId(), 'user-id');
        assert.equal(msg.anonymousId(), 'anonymous-id');
        assert.deepEqual(msg.context(), { ip: '0.0.0.0' });
        assert.deepEqual(msg.event(), 'Viewed Docs Integration Page');
        assert.deepEqual(msg.properties(), {
          url: 'segment.com/docs/page',
          category: 'Docs',
          name: 'Integration'
        });
        done();
      });
    });

    it('should send all tracks when pages settings are all true', function(done){
      segment.settings.trackAllPages = true;
      segment.settings.trackNamedPages = true;
      segment.settings.trackCategorizedPages = true;
      segment.page(page, function(err){
        if (err) return done(err);
        assert.equal(tracks.length, 3);
        assert.equal(tracks[0].event(), 'Loaded a Page');
        assert.equal(tracks[1].event(), 'Viewed Docs Page');
        assert.equal(tracks[2].event(), 'Viewed Docs Integration Page');
        done();
      });
    });

    it('should send events for screen when only page is defined', function(done){
      segment.settings.trackAllPages = true;
      segment.settings.trackNamedPages = true;
      segment.settings.trackCategorizedPages = true;
      segment.screen(page, function(err){
        if (err) return done(err);
        assert.equal(tracks.length, 3);
        assert.equal(tracks[0].event(), 'Loaded a Page');
        assert.equal(tracks[1].event(), 'Viewed Docs Page');
        assert.equal(tracks[2].event(), 'Viewed Docs Integration Page');
        done();
      });
    });
  });

  describe('.screen(screen, fn)', function(){
    var screen;
    var tracks;

    beforeEach(function(){
      var Segment = integration('Segment');
      Segment.mapToTrack(['screen']);
      tracks = [];
      segment = new Segment({});
      segment.track = function(msg, done){
        tracks.push(msg);
        setImmediate(done);
      };
    });

    beforeEach(function(){
      screen = new Screen({
        userId: 'user-id',
        anonymousId: 'anonymous-id',
        name: 'Integration',
        category: 'Docs',
        properties: {
          view: 'docs - screen'
        },
        context: {
          ip: '0.0.0.0'
        }
      });
    });

    it('should map screen if mapper.screen is defined', function(done){
      var test = integration('test').mapper({ screen: mapper() });
      test.prototype.screen = mapper.test(done);
      test().screen({}, done);
    });

    it('should map screen if mapper.page is defined', function(done){
      var test = integration('test').mapper({ page: mapper() });
      test.prototype.screen = mapper.test(done);
      test().screen({}, done);
    });

    it('should send "Loaded a Screen" if .trackAllPages is true', function(done){
      segment.settings.trackAllPages = true;
      segment.screen(screen, function(err){
        if (err) return done(err);
        var msg = tracks[0];
        assert.equal(tracks.length, 1);
        assert.equal(msg.userId(), 'user-id');
        assert.equal(msg.anonymousId(), 'anonymous-id');
        assert.deepEqual(msg.context(), { ip: '0.0.0.0' });
        assert.deepEqual(msg.event(), 'Loaded a Screen');
        assert.deepEqual(msg.properties(), {
          view: 'docs - screen',
          category: 'Docs',
          name: 'Integration'
        });
        done();
      });
    });

    it('should send "Viewed Docs Screen" if .trackCategorizedPages is true', function(done){
      segment.settings.trackCategorizedPages = true;
      segment.screen(screen, function(err){
        if (err) return done(err);
        var msg = tracks[0];
        assert.equal(tracks.length, 1);
        assert.equal(msg.userId(), 'user-id');
        assert.equal(msg.anonymousId(), 'anonymous-id');
        assert.deepEqual(msg.context(), { ip: '0.0.0.0' });
        assert.deepEqual(msg.event(), 'Viewed Docs Screen');
        assert.deepEqual(msg.properties(), {
          view: 'docs - screen',
          category: 'Docs',
          name: 'Integration'
        });
        done();
      });
    });

    it('should send "Viewed Docs Integration Screen" if .trackNamedPages is true', function(done){
      segment.settings.trackNamedPages = true;
      segment.screen(screen, function(err){
        if (err) return done(err);
        var msg = tracks[0];
        assert.equal(tracks.length, 1);
        assert.equal(msg.userId(), 'user-id');
        assert.equal(msg.anonymousId(), 'anonymous-id');
        assert.deepEqual(msg.context(), { ip: '0.0.0.0' });
        assert.deepEqual(msg.event(), 'Viewed Docs Integration Screen');
        assert.deepEqual(msg.properties(), {
          view: 'docs - screen',
          category: 'Docs',
          name: 'Integration'
        });
        done();
      });
    });

    it('should send all tracks when pages settings are all true', function(done){
      segment.settings.trackAllPages = true;
      segment.settings.trackNamedPages = true;
      segment.settings.trackCategorizedPages = true;
      segment.screen(screen, function(err){
        if (err) return done(err);
        assert.equal(tracks.length, 3);
        assert.equal(tracks[0].event(), 'Loaded a Screen');
        assert.equal(tracks[1].event(), 'Viewed Docs Screen');
        assert.equal(tracks[2].event(), 'Viewed Docs Integration Screen');
        done();
      });
    });

    it('should send events for page when only screen is defined', function(done){
      segment.settings.trackAllPages = true;
      segment.settings.trackNamedPages = true;
      segment.settings.trackCategorizedPages = true;
      segment.page(screen, function(err){
        if (err) return done(err);
        assert.equal(tracks.length, 3);
        assert.equal(tracks[0].event(), 'Loaded a Screen');
        assert.equal(tracks[1].event(), 'Viewed Docs Screen');
        assert.equal(tracks[2].event(), 'Viewed Docs Integration Screen');
        done();
      });
    });
  });

  describe('.group(group, fn)', function(){
    it('should map group if mapper.group is defined', function(done){
      var test = integration('test').mapper({ group: mapper() });
      test.prototype.group = mapper.test(done);
      test().group({}, done);
    });
  });

  describe('.retry(err)', function(){
    it('200', function(){
      assert(false == segment.retry({ status: 200 }));
    });

    it('404', function(){
      assert(false == segment.retry({ status: 404 }));
    });

    it('429', function(){
      assert(true == segment.retry({ status: 429 }));
    });

    it('500', function(){
      assert(true == segment.retry({ status: 500 }));
    });

    it('501', function(){
      assert(false == segment.retry({ status: 501 }));
    });

    it('502', function(){
      assert(true == segment.retry({ status: 502 }));
    });

    it('503', function(){
      assert(true == segment.retry({ status: 503 }));
    });

    it('504', function(){
      assert(true == segment.retry({ status: 504 }));
    });

    it('ECONNRESET', function(){
      assert(true == segment.retry({ code: 'ECONNRESET' }));
    });

    it('ECONNREFUSED', function(){
      assert(true == segment.retry({ code: 'ECONNREFUSED' }));
    });

    it('ECONNABORTED', function(){
      assert(true == segment.retry({ code: 'ECONNABORTED' }));
    });

    it('ETIMEDOUT', function(){
      assert(true == segment.retry({ code: 'ETIMEDOUT' }));
    });

    it('EADDRINFO', function(){
      assert(true == segment.retry({ code: 'EADDRINFO' }));
    });

    it('ENOTFOUND', function(){
      assert(true == segment.retry({ code: 'ENOTFOUND' }));
    });

    it('should error on other errors', function(){
      assert(true == segment.retry({}));
      assert(true == segment.retry(new Error('whoops')));
      assert(true == segment.retry(new TypeError('whoops')));
    });
  });

  describe('.enabled()', function(){
    var Test = integration('test').server();
    var test = Test({});

    it('should return true when sent on a supported channel', function(){
      var facade = new Page({ channel: 'server' });
      assert.strictEqual(test.enabled(facade), true);
    });

    it('should return false when sent on an unsupported channel', function(){
      var facade = new Page({ channel: 'client' });
      assert.strictEqual(test.enabled(facade), false);
    });

    it('should return false when this integration is disabled for this message', function(){
      var facade = new Page({ channel: 'server', integrations: { test: false } });
      assert.strictEqual(test.enabled(facade), false);
    });

    it('should return true when channel is `client` and integration is listed as unbundled', function(){
      var facade = new Page({ channel: 'client', _metadata: { bundled: [], unbundled: ['test'] } });
      assert.strictEqual(test.enabled(facade), true);
    });

    it('should return false when this integration is unbundled and disabled for this message', function(){
      var facade = new Page({
        channel: 'client',
        integrations: { test: false },
        _metadata: { bundled: [], unbundled: ['test'] }
      });
      assert.strictEqual(test.enabled(facade), false);
    });

    it('should return false when channel is not supported and bundled metadata is not included', function(){
      var facade = new Page({ channel: 'client' });
      assert.strictEqual(test.enabled(facade), false);
    });
  });
});

/**
 * Default mapper.
 *
 * @return {Function}
 */

function mapper(){
  return function(msg, settings){
    return { msg: msg, settings: settings };
  };
}

/**
 * Mapper test.
 */

mapper.test = function(done){
  return function(payload, fn){
    assert(payload.settings == this.settings);
    assert(payload.msg);
    assert.equal('function', typeof fn);
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

/**
 * Tick.
 */

function tick(msg, fn){
  setImmediate(fn);
}
