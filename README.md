# missive

Fast, lightweight library for encoding and decoding JSON messages over streams.

This is mainly intended for TCP applications, where the concept of messages
doesn't really exist.

### How it works

Rather than simply using newlines to delimit messages, `missive` uses the 
time-honored tradition of length prefixing. We think this is safer, and it
can also be quite a bit faster in certain situations.

### Examples

##### Piping data

Both streams pipe `Buffer` instances on the way out (like pretty much
all streams), but `encode` expects on object to be passed to `write`.

```js
let missive = require('missive');
// create an encoder stream
let encode = missive.encode();
// create a parser stream
let parse = missive.parse();

encode.pipe( parse ).pipe( process.stdout );

encode.write({ hello: 'world' }); // should log {"hello": "world"}
```

##### `data` events

Both streams implement standard `data` events, which emit `Buffer` instances.

```js
let missive = require('missive');
let encode = missive.encode();
let parse = missive.parse();

parse.on( 'data', function( buffer ) {
  console.log( buffer instanceof Buffer ); // true
});

encode.write({ foo: 'bar' });
```

##### `message` event

The `parse` stream also implements a custom `message` event for convenience.
Rather than emitting a `Buffer` instance, the `message` event emits a parsed
JavaScript object.

```js
let missive = require('missive');
let encode = missive.encode();
let parse = missive.parse();

parse.on( 'message', function( obj ) {
  console.log( obj.foo ); // 'bar'
});

encode.write({ foo: 'bar' });
```

##### Writing to sockets

```js
let net = require('net');
let missive = require('missive')p;
let server = net.createServer();

server.listen( 1337 );

server.on( 'connection', function( socket ) {
  let encode = missive.encode();
  encode.pipe( socket );
  encode.write({ hello: 'world' });
});
```

##### Reading from sockets

```js
let net = require('net');
let missive = require('missive');
let client = net.createConnection({ port: 1337 });

client.pipe( missive.parse() ).on( 'message', function( obj ) {
  console.log( obj ); // { hello: 'world' }
});
```
