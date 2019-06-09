
var integration = require('..')
var assert = require('assert')

describe('integration', function () {
  describe('()', function () {
    it('should throw if name isnt given', function (done) {
      try {
        integration()
      } catch (e) {
        assert(e.message === 'expected integration name')
        done()
      }
    })
  })

  describe('(name)', function () {
    var Test

    beforeEach(function () {
      Test = integration('Test')
    })

    it('should return a constructor', function () {
      assert(new Test())
    })

    it('should work without new', function () {
      assert(Test() instanceof Test)
    })

    it('should set the .name', function () {
      assert(Test().name === 'Test')
    })

    it('should inherit emitter', function (done) {
      var test = Test()
      test.on('something', done)
      test.emit('something')
    })

    it('should set .debug', function () {
      assert(typeof Test().debug === 'function')
    })

    it('should call .initialize()', function (done) {
      Test.prototype.initialize = done
      new Test() // eslint-disable-line
    })

    it('should expose `name` on .prototype', function () {
      assert.equal('Test', Test.prototype.name)
    })
  })
})
