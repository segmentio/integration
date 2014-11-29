
[![Build Status](https://travis-ci.org/segmentio/integration.svg?branch=master)](https://travis-ci.org/segmentio/integration)

# segmentio-integration

  Segment.io integration base prototype.

## API

##### `integration(name)`

  Create an `Integration` constructor with `name`.

  ```js
  var MyIntegration = integration('My Integration');
  ```

#### .mapping(key)

  Add a new mapping option by `key`. The option will be an array that the user can pass in of `key -> value` mappings. This will also generated a `#KEY` method on the integration's prototype for easily accessing the mapping.

  For example if your integration only supports a handful of events like `Signed Up` and `Completed Order`, you might create an mapping option called `events` that the user would pass in, like so:

```js
var MyIntegration = Integration('MyIntegration')
  .mapping('events');
```

  Which means that when the integration is initialized, it would be passed a mapping of `events` to use, like so:

```js
new MyIntegration({
  events: [
    { key: 'Signed Up', value: 'Register' },
    { key: 'Completed Order', value: 'Purchase' }
  ]
});
```

  Then later on, you can easily get all of the entries with a specific key, by calling `this.events(key)`. For example:

```js
MyIntegration.prototype.track = function(msg, fn){
  var matches = this.events(msg.event());
  var batch = new Batch;
  var self = this;

  each(matches, function(value){
    batch.push(function(done){
      self
      .post('/track')
      .send({ event: value })
      .send({ props: msg.properties() })
      .end(done);
    });
  });

  batch.end(fn);
};
```

#### .mapToTrack(arr)

  Map the given array of `methods` to `track()` calls.

  Some integration don't support page views, but they support events
  so you can `.mapToTrack(['page'])` and the integration will start transforming
  any page calls to events and pass them to `track()`.

  There are 3 settings users can turn on:

    - .trackAllPages
    - .trackNamedPages
    - .trackCategorizedPages

  `.trackAllPages` will transform any `Page` to `Track(event: "Loaded a Page")`.
  `.trackNamedPages` will transform any named page to `Track(event: "Viewed {category} {name} Page")`.
  `.trackCategorizedPages` will transform any categorized page to `Track(event: "Viewed {category} Page")`.

  Example:

  ```js
  var MyIntegration = Integration('My Integration')
    .mapToTrack(['page']);

  MyIntegration.prototype.track = function(track, done){
    send(track.event(), track.properties(), done);
  };
  ```

#### .ensure(':type.:path')

  Ensure `type` (`settings` / `message`) with `path` exists.

  ```js
  .ensure('settings.apiKey');
  .ensure('message.userId');
  .ensure('message.context.ip');
  .ensure('message.traits.firstName');
  ```

#### .ensure(fn)

  Add a custom validation with `fn(msg, settings) -> Error`

  Dynamically validate settings (taken from Mixpanel):

  ```js
  Mixpanel.ensure(function(msg, settings){
    if (settings.apiKey) return;
    if ('track' != msg.type()) return;
    if (!shouldImport(msg)) return;
    return this.invalid('.apiKey is required if "track" message is older than 5 days.');
  });
  ```

  Dynamically validate message:

  ```js
  Integration.ensure(function(msg, _){
    if (msg.userId() && msg.proxy('message.context.ip')) return;
    return this.reject('message.userId is required');
  });
  ```

#### .endpoint(url)

  Set the default endpoint for all requests.

  ```js
  .endpoint('https://api.integration.io/v1');
  ```

#### .timeout(ms)

  Set the request timeout to be `ms`

  ```js
  .timeout(3000);
  .timeout('3s');
  ```

#### .retries(n)

  Set how many times the integration should retry a request

  ```js
  .retries(2);
  ```

#### .channels(array)

  Enable the integration on all channels in `array`.

  ```js
  .channels(['server', 'client', 'mobile']);
  ```

#### .reject(reason, ...), #reject(reason, ...)

  Reject a `msg` with `reason`, returns a `MessageRejectedError`.

  ```js
  if (something) return fn(this.reject('some reason'));
  ```

#### .invalid(reason, ...), #reject(reason, ...)

  Reject `settings` with `reason`.

  ```js
  if (something) return fn(this.invalid('some reason'));
  ```

#### .error(reason, ...), #error(reason, ...)

  Error with `reason`.

  ```js
  if (200 != res.status) return fn(this.error('expected 200 but got %d', res.status));
  ```

#### #map(obj, event)

  Get a list of events with `obj` and `event`.

  ```js
  events = { my_event: 'a4991b88' }
  .map(events, 'My Event');
  // => ["a4991b88"]
  .map(events, 'whatever');
  // => []

  events = [{ key: 'my event', value: '9b5eb1fa' }]
  .map(events, 'my_event');
  // => ["9b5eb1fa"]
  .map(events, 'whatever');
  // => []
  ```

#### #lock(key, fn)

  Lock a `key` with `fn`.

  This is used because some API's create duplicates.

  ```js
  var self = this;
  var key = [this.settings.apiKey, msg.userId()].join(':');
  this.lock(key, function(){
    createUser(function(err, res){
      self.unlock(key, function(){
        if (err) return fn(err);
        fn(null, res);
      });
    });
  });
  ```

#### #unlock(key, fn)

  Unlocks `key`.

#### #<http-method>([url])

 Create a new superagent.Request with `url`. See [superagent](http://visionmedia.github.io/superagent/) docs for available methods (auth, headers, etc.).

  ```js
  this
    .post('/some-path')
    .send(payload)
    .end(fn);
  ```

#### #handle(fn)

  Handle HTTP response, errors if the response is not `2xx, 3xx`.

  ```js
  this
    .post('/some-path')
    .send(payload)
    .end(this.handle(fn));
  ```

#### #redis()

  Set / Get redis instance.

#### #logger()

  Set / Get the logger instance.

#### #jstrace()

  Set / Get jstrace instance.

#### #trace(str, obj)

  Trace `str` with optional `obj`.

#### #retry(err)

  This method gets invoked by the worker
  after the worker recieves an `(err,)`, it
  will call this method to figure out if this integration
  needs to retry this request.
 
  By default it checks for:
 
  ```js
  err.status = 500
  err.status = 502
  err.status = 503
  err.status = 504
  err.code = "ETIMEDOUT"
  err.code = "EADDRINFO"
  err.code = "EADDRINFO"
  err.code = "ECONNRESET"
  err.code = "ECONNREFUSED"
  err.code = "ECONNABORTED"
  err.code = "EHOSTUNREACH"
  err.code = "ENOTFOUND"
  ```
 
  When the method returns true the worker re-queues the message
  and it will be retried later on.

  Sometimes you might want to "extend" that method
  to get the worker to ignore more errors, suppose you
  want to retry requests on [`429 "too many requests"`](http://doc.intercom.io/api/#rate-limiting), you can "extend" the method easily like:

  ```js
  var retry = proto.retry;
  proto.retry = function(err){
    return retry.apply(this, arguments) 
      || 429 == err.status; // "too many requests, ratelimit exceeded"
  };
  ```
 

## License

(The MIT License)

Copyright (c) 2013 Segment.io &lt;friends@segment.io&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
