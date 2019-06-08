
/**
 * Module dependencies.
 */

var integration = require('..')

/**
 * Expose `Example`
 */

var Example = module.exports = integration('Example')
  .channels(['server', 'mobile', 'client'])
  .endpoint('http://localhost:3000')
  .ensure('settings.appId')
  .ensure('message.userId')
  .retries(2)

/**
 * Identify.
 *
 * Some APIS don't lock on user creation, so they might show
 * duplicate users, to solve this we lock using redis.
 *
 * Note that you must prefix the `key` with some setting that identifies
 * the project in the service, like `apiKey` or `appId` etc...
 *
 * In this example we use `appId:userId` as the lock key, to make
 * sure the `userId` is locked on the app level in this service.
 *
 * @param {Identify} msg
 * @param {Function} fn
 */

Example.prototype.identify = function (msg, fn) {
  var key = [this.settings.appId, msg.userId()].join(':')
  var self = this
  this.lock(key, function () {
    return self
      .post('/users')
      .type('json')
      .send(msg.json())
      .end(self.handle(function (err, res) {
        self.unlock(key, function () {
          fn(err, res)
        })
      }))
  })
}
