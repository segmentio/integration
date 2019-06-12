
var track = require('./support').track
var { promisifyAll } = require('bluebird')
var integration = require('..')
var assert = require('assert')
var redis = require('redis')
promisifyAll(redis.RedisClient.prototype)
promisifyAll(redis.Multi.prototype)

describe('lockAsync', function () {
  var segment
  var db
  var msgs

  beforeEach(function () {
    db = redis.createClient()
  })

  beforeEach(function () {
    var Segment = integration('Segment.io')
    Segment.endpoint('http://dummy.io')
    segment = Segment()
    segment.redis(db)
  })

  afterEach(async function () {
    await db.delAsync('users')
  })

  beforeEach(function () {
    msgs = [
      track({ userId: 1, event: 'a' }),
      track({ userId: 1, event: 'b' }),
      track({ userId: 1, event: 'c' }),
      track({ userId: 1, event: 'd' }),
      track({ userId: 1, event: 'f' }),
      track({ userId: 2, event: 'e' })
    ]
  })

  it('should prefix with the integration name', async function () {
    await segment.lock('some-key')

    try {
      const exists = await db.existsAsync('Segment.io:some-key')
      if (!exists) throw new Error('expected key to exist')
    } catch (e) {
      throw e
    }

    return segment.unlock('some-key')
  })

  describe('without lock', function () {
    it('should override previous event', async function () {
      segment.track = withoutLock
      const promises = []

      msgs.forEach(function (msg) {
        promises.push(segment.track(msg))
      })

      await Promise.all(promises)

      const users = await db.hgetallAsync('users')

      assert.deepEqual(users, { 1: 'f', 2: 'e' })
    })
  })

  describe('with lock', function () {
    it('should return errors for any locks already aquired', async function () {
      segment.track = withLock

      for (let i = 0; i < msgs.length; i++) {
        try {
          await segment.track(msgs[i])
        } catch (e) {
          if (e.code !== 'RESOURCE_LOCKED') {
            throw e
          }
        }
      }

      const users = await db.hgetallAsync('users')
      assert.deepEqual(users, { 1: 'a', 2: 'e' })
    })
  })

  describe('with timed lock', function () {
    it('should return errors for any locks already aquired', async function () {
      segment.track = withTimedLock

      for (let i = 0; i < msgs.length; i++) {
        try {
          await segment.track(msgs[i])
        } catch (e) {
          if (e.code !== 'RESOURCE_LOCKED') {
            throw e
          }
        }
      }

      const users = await db.hgetallAsync('users')
      assert.deepEqual(users, { 1: 'a', 2: 'e' })
    })
  })

  async function withoutLock (msg) {
    const users = await db.hgetAsync('users', msg.userId())
    if (!users) {
      await db.hsetAsync('users', msg.userId(), msg.event())
    }
  }

  async function withLock (msg) {
    await this.lock(msg.userId())

    try {
      const users = await db.hgetAsync('users', msg.userId())
      if (!users) {
        await db.hsetAsync('users', msg.userId(), msg.event())
      }
    } catch (e) {
      throw e
    } finally {
      await this.unlock(msg.userId())
    }
  }

  async function withTimedLock (msg) {
    await this.lock(msg.userId(), 30000)

    try {
      const users = await db.hgetAsync('users', msg.userId())
      if (!users) {
        await db.hsetAsync('users', msg.userId(), msg.event())
      }
    } catch (e) {
      throw e
    } finally {
      await this.unlock(msg.userId())
    }
  }
})
