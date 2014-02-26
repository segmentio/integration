
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
      var test = integration('test');
      var port = server.address().port;
      test.endpoint('http://localhost:' + port);
      test.retries(5);
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
})
