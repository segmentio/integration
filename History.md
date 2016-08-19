
4.0.1 / 2016-08-19
==================

  * adding ability to set ca
  * changed request to return res and req

4.0.0 / 2016-06-06
==================

  * Upgrade Analytics-Events to V2 to support our v2 spec.

3.2.1 / 2016-03-21
==================

  * add 429 retry case
  * Remove redundant integration name prefix, we already send it in a seperate key
  * test: add complete response tests
  * Update package.json

3.2.0 / 2015-02-18
==================

  * .mapToTrack(): add screen support
  * tests: add #initialize closes #57


3.1.0 / 2015-02-14
==================

  * Bump superagent to 0.21.0

3.0.6 / 2015-02-14
==================

  * Bring makefile, deps in line with template
  * docs: add #initialize
  * Update readme

3.0.5 / 2014-12-08
==================

 * Dont return request instance to caller

3.0.4 / 2014-12-04
==================

 * Add .agent() for setting the http.Agent on requests

3.0.3 / 2014-12-02
==================

  * Change retries to checks

3.0.2 / 2014-12-02
==================

  * Remove old retries

3.0.1 / 2014-12-02
==================

  * only wrap defined methods

3.0.0 / 2014-12-02
==================

  * remove default implementations of track, alias, identify, page, screen and group.
  * deprecate .retries()
  * remove superagent-retry
  * add retry

2.3.4 / 2014-11-21
==================

  * Follow same slug format as metadata
  * Debug the name of the method
  * Cleanup readme

2.3.3 / 2014-10-21
==================

  * lowering locking retry
  * add docs
  * add .mapToTrack() to explicitly enable default mapping to .track()

2.3.2 / 2014-10-08
==================

 * update superagent-retry

2.3.0 / 2014-09-16
==================

 * add .mapping(name)
 * add docs

2.2.0 / 2014-09-04
==================

 * Add .slug() to proto and static

2.1.0 / 2014-09-04
==================

 * travis: add redis-server
 * add .lock() and .unlock()
 * remove .lock(), .unlock() http methods
 * add jstrace

2.0.3 / 2014-09-01
==================

 * normalize errors and add .error(msg, ...) as BadRequest

2.0.2 / 2014-08-27
==================

 * errors: fix null ctx

2.0.1 / 2014-08-27
==================

 * mapper: fix typo in mapper

2.0.0 / 2014-08-27
==================

 * use `reject()` in `.ensure('message.*')`
 * add `.reject()` to reject messages.
 * deps: upgrade facade
 * .ensure(): error if setting is an empty string
 * proto: remove all settings
 * validations: move to array
 * add `.channels(arr)`
 * .handle(): pass response to callback on error
 * add `.error(msg, ...)`
 * accept settings in constructor (`Integration(settings)`)
 * tests: add another retry test
 * mapper: fix context

1.3.1 / 2014-08-06
==================

  * Return request instance from onend
  * tests: fix tests, no clue how they worked before...
  * tests: prevent port used err
  * tests: use http.Server for faster tests
  * travis: remove node 0.11
  * request: add default user agent
  * add travis.yml
  * timeout(): allow ms string
  * tests: less whitespace
  * errors: cleanup and capture stack trace
  * inline channels and remove ./channels.js
  * inline ecommerce wrapping in wrap-methods

1.3.0 / 2014-07-23
==================

 * expose "name" statically on proto

1.2.0 / 2014-06-23
==================

 * pin analytics-events@1.x
 * add make-lint
 * add ecommerce

1.1.0 / 2014-06-09
==================

 * rename .events() -> .map()
 * add .events()

1.0.2 / 2014-04-01
==================

 * adding a .timeout() static and a default timeout of 10s
 * add shortcuts for .enabled(), closes #7

1.0.1 / 2014-03-11
==================

 * fixing ensure error message to include integration

1.0.0 / 2014-03-06
==================

 * refactor

0.2.1 / 2014-02-18
==================

 * Merge pull request #2 from segmentio/add/methods
 * Release 0.2.0
 * Merge pull request #1 from segmentio/add/accepted
 * dont error on all 200s
 * add methods

0.2.0 / 2014-02-17
==================

 * dont error on all 200s

0.1.1 / 2013-12-03
==================

  * updating `debug` statements

0.1.0 / 2013-08-29
==================

  * Initial release
