
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
