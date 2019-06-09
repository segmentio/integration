
var helpers = require('./support')
var integration = require('..')
var assert = require('assert')
var http = require('http')

describe('statics', function () {
  describe('.endpoint()', function () {
    it('should set the endpoint', function () {
      var test = integration('test').endpoint('test')
      assert(test().endpoint === 'test')
    })
  })

  describe('.mapping(name)', function () {
    it('should create a mapping method', function () {
      var Segment = integration('Segment')
      Segment.mapping('events')
      var segment = new Segment({ events: { a: 'd2ecbc98' } })
      assert.deepEqual(['d2ecbc98'], segment.events('a'))
    })

    it('should use .map()', function () {
      var Segment = integration('Segment')
      Segment.mapping('events')
      var segment = new Segment({ events: { a: 'd2ecbc98' } })
      assert.deepEqual(['d2ecbc98'], segment.events('a'))
      assert.deepEqual(['d2ecbc98'], segment.events('A'))
      segment = new Segment({ events: [{ key: 'a', value: 'd2ecbc98' }, { key: 'a', value: 'c18f536e' }] })
      assert.deepEqual(['d2ecbc98', 'c18f536e'], segment.events('a'))
    })
  })

  describe('.mapper(obj)', function () {
    it('should set the mapper correctly', function () {
      var mapper = {}
      var test = integration('segment')
      test.mapper(mapper)
      assert(mapper === test().mapper)
    })
  })

  describe('.client()', function () {
    it('should be enabled on client too', function () {
      var test = integration('test').client()()
      var t = helpers.track({ channel: 'client' })
      assert.equal(test.enabled(t, {}), undefined)
    })

    it('should not be enabled on mobile', function () {
      var test = integration('test').client()()
      var t = helpers.track({ channel: 'mobile' })
      const enabledErr = test.enabled(t, {})
      assert.equal(enabledErr.message, 'this message was sent client side')
      assert.equal(enabledErr.status, 'MESSAGE_SENT_CLIENT_SIDE')
    })
  })

  describe('.client() && .mobile()', function () {
    it('should be enabled on both', function () {
      var test = integration('test')
      var a = helpers.track({ channel: 'client' })
      var b = helpers.track({ channel: 'mobile' })
      test.client()
      test.mobile()
      test = test()
      assert.equal(test.enabled(a, {}), undefined)
      assert.equal(test.enabled(b, {}), undefined)
    })
  })

  describe('.channels(array)', function () {
    it('should set `prototype.channels`', function () {
      var test = integration('test')
      test.channels(['one', 'two'])
      assert.deepEqual(test.prototype.channels, ['one', 'two'])
    })
  })

  describe('.channel(chan)', function () {
    it('should push to prototype.channels', function () {
      var test = integration('test')
      test.channel('baz')
      assert(~test.prototype.channels.indexOf('baz'))
    })

    it('should not push a channel if it exists', function () {
      var test = integration('test')
      var length = test.prototype.channels.length
      test.channel('b')
      test.channel('b')
      assert(length + 1 === test.prototype.channels.length)
    })
  })

  describe('.timeout(timeout)', function () {
    var server
    before(function (done) {
      server = http.createServer(respond)
      server.listen(done)
      function respond (req, res) {
        setTimeout(function () {
          res.writeHead(200)
          res.end()
        }, 100)
      }
    })

    after(function () {
      server.close()
    })

    it('should have a default timeout', function () {
      var test = integration('test')
      assert(test.prototype.timeout === 10000)
    })

    it('should be able to set a new timeout', function () {
      var test = integration('test')
      test.timeout(10)
      assert(test.prototype.timeout === 10)
    })

    it('should set timeouts on the request', function (done) {
      var port = server.address().port
      var test = integration('test')
      test.endpoint('http://localhost:' + port)
      test.timeout(10)
      var req = test().request()
      req.end(function (err, res) {
        assert(err && err.timeout)
        done()
      })
    })
  })

  describe('#slug', function () {
    it('should return the `name` in "slug" format', function () {
      var test = integration('My Test.IO')
      assert.equal('my-testio', test.slug())
    })
  })

  describe('#ca', function () {
    it('should allow you to set the list of cs', function () {
      var test = integration('test')
      test.ca(['foo'])
      var req = test().request()
      assert.deepEqual(req._ca, ['foo'])
    })
  })
})
