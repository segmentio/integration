
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
  .mapping('events')
  .retries(2)

/**
 * Track.
 *
 * .events() method was created when `.mapping('events')` was called
 * it accepts an event name and returns all values matching it.
 *
 * Suppose that an integration only supports event1-12 a user might
 * than want to map "Played a Song" event to `event1` and `event2`.
 *
 * All he has to do is map "Played a Song" to event1 and event2
 * in our UI, the `.event()` method than will fuzzy match the event
 * name and return an array of `[event1, event2]`.
 *
 * @param {Track} msg
 * @param {Function} fn
 */

Example.prototype.track = function (msg, fn) {
  var actions = this.events(msg.event())

  if (!actions.length) return process.nextTick(fn)

  return this
    .post('/events')
    .send({ actions: actions })
    .send({ userId: msg.userId() })
    .end(this.handle(fn))
}
