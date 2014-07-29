
var helpers = require('./support');
var integration = require('..');
var assert = require('assert');
var redis = require('redis');
var Batch = require('batch');

describe('.locked(key, fn)', function(){
  var segment;
  var api;
  var db;

  before(function(){
    db = redis.createClient();
  });

  beforeEach(function(){
    var Segment = integration('Segment.io');
    Segment.endpoint('http://dummy.io');
    segment = new Segment;
    segment.redis(db);
  });

  beforeEach(function(done){
    db.del('users', done);
  });

  beforeEach(function(){
    msgs = [
      helpers.track({ userId: 1, event: 'a' }),
      helpers.track({ userId: 1, event: 'b' }),
      helpers.track({ userId: 1, event: 'c' }),
      helpers.track({ userId: 1, event: 'd' }),
      helpers.track({ userId: 1, event: 'f' }),
      helpers.track({ userId: 2, event: 'e' }),
    ];
  });

  describe('without lock', function(){
    it('should override previous event', function(done){
      var batch = new Batch;

      segment.track = withoutLock;

      msgs.forEach(function(msg){
        batch.push(function(done){
          segment.track(msg, {}, done);
        });
      });

      batch.end(function(err){
        if (err) return done(err);
        db.hgetall('users', function(err, vals){
          if (err) return done(err);
          assert.equal('f', vals[1]);
          assert.equal('e', vals[2]);
          done();
        });
      });
    });
  });

  describe('with lock', function(){
    it('should not override the previous event', function(done){
      var batch = new Batch;

      segment.track = withLock;

      msgs.forEach(function(msg){
        batch.push(function(done){
          segment.track(msg, {}, done);
        });
      });

      batch.end(function(err){
        if (err) return done(err);
        db.hgetall('users', function(err, vals){
          if (err) return done(err);
          assert.equal('a', vals[1]);
          assert.equal('e', vals[2]);
          done();
        });
      });
    });
  });

  // track with lock
  function withLock(msg, _, fn){
    this.locked(msg.userId(), function(err, unlock){
      if (err) return fn(err);
      db.hget('users', msg.userId(), function(err, value){
        if (err) return fn(err);
        if (value) return unlock(fn);
        db.hset('users', msg.userId(), msg.event(), function(err){
          if (err) return fn(err);
          unlock(fn);
        });
      });
    });
  }

  // track without lock
  function withoutLock(msg, _, fn){
    db.hget('users', msg.userId(), function(err, value){
      if (err) return fn(err);
      if (value) return setImmediate(fn);
      db.hset('users', msg.userId(), msg.event(), fn);
    });
  }
});
