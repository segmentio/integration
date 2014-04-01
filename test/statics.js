
var helpers = require('./support');
var integration = require('..');
var assert = require('assert');
var http = require('http');

describe('statics', function(){
  describe('.endpoint()', function(){
    it('should set the endpoint', function(){
      var test = integration('test').endpoint('test');
      assert('test' == test().endpoint);
    })
  })

  describe('.retries(n)', function(){
    var requests = 0;
    var server;

    before(function(done){
      server = http.createServer(respond);
      server.listen(done);

      function respond(req, res){
        if (++requests < 4) {
          res.writeHead(503);
          res.end();
        } else {
          res.writeHead(200);
          res.end();
        }
      }
    })

    after(function(){
      server.close();
    })

    it('should retry', function(done){
      var port = server.address().port;
      var test = integration('test')
        .endpoint('http://localhost:' + port)
        .retries(5);
      var req = test().request();
      req.end(function(err, res){
        assert(4 == requests);
        done();
      });
    })
  })

  describe('.mapper(obj)', function(){
    it('should set the mapper correctly', function(){
      var mapper = {};
      var test = integration('segment');
      test.mapper(mapper);
      assert(mapper == test().mapper);
    })
  })

  describe('.client()', function(){
    it('should be enabled on client too', function(){
      var test = integration('test').client()();
      var t = helpers.track({ channel: 'client' });
      assert(test.enabled(t, {}));
    })

    it('should not be enabled on mobile', function(){
      var test = integration('test').client()();
      var t = helpers.track({ channel: 'mobile' });
      assert(!test.enabled(t, {}));
    })
  })

  describe('.client() && .mobile()', function(){
    it('should be enabled on both', function(){
      var test = integration('test');
      var a = helpers.track({ channel: 'client' });
      var b = helpers.track({ channel: 'mobile' });
      test.client();
      test.mobile();
      test = test();
      assert(test.enabled(a, {}));
      assert(test.enabled(b, {}));
    })
  })

  describe('.channel(chan)', function(){
    it('should push to prototype.channels', function(){
      var test = integration('test');
      test.channel('baz');
      assert(~test.prototype.channels.indexOf('baz'));
    })

    it('should not push a channel if it exists', function(){
      var test = integration('test');
      var length = test.prototype.channels.length;
      test.channel('b');
      test.channel('b');
      assert(length + 1 == test.prototype.channels.length);
    })
  })

  describe('.timeout(timeout)', function(){
    var server;
    before(function(done){
      server = http.createServer(respond);
      server.listen(done);
      function respond(req, res){
        setTimeout(function(){
          res.writeHead(200);
          res.end();
        }, 100);
      }
    });

    after(function(){
      server.close();
    });

    it('should have a default timeout', function(){
      var test = integration('test');
      assert(test.prototype.timeout === 10000);
    });

    it('should be able to set a new timeout', function(){
      var test = integration('test')
        .timeout(10);
      assert(test.prototype.timeout === 10);
    });

    it('should set timeouts on the request', function(done){
      var port = server.address().port;
      var test = integration('test')
        .timeout(10)
        .endpoint('http://localhost:' + port);
      var req = test().request();
      req.end(function(err, res){
        assert(err && err.timeout);
        done();
      });
    });
  });
})
