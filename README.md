# missive

[![Build Status](https://travis-ci.org/StarryInternet/missive.svg?branch=master)](https://travis-ci.org/StarryInternet/missive)

Fast, lightweight library for encoding and decoding JSON messages over streams.

Built using [fringe](https://github.com/StarryInternet/fringe)

### Installing

```
npm install --save missive
```

### How it works

Rather than simply using newlines to delimit messages, `missive` uses the
time-honored tradition of length prefixing. We think this is safer, and it
can also be quite a bit faster.

### Examples

##### Piping data

`missive` exports just two functions, `encode()` and `parse()`. Each returns
an instance of `Stream.Transform`.

Both streams pipe `Buffer` instances on the way out (like pretty much
all streams), but `encode` expects an object to be passed to `write`.

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

parse.on( 'data', buffer => {
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

parse.on( 'message', obj => {
  console.log( obj.foo ); // 'bar'
});

encode.write({ foo: 'bar' });
```

##### Writing to sockets

```js
let net = require('net');
let missive = require('missive');
let server = net.createServer();

server.listen( 1337 );

server.on( 'connection', socket => {
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

client.pipe( missive.parse() ).on( 'message', obj => {
  console.log( obj ); // { hello: 'world' }
});
```

##### Compression

To enable Node's `zlib` compression, instantiate an `encode` stream
with `{ deflate: true }` and a `parse` stream with `{ inflate: true }`

Note that this will incur a fairly substantial performance penalty, so
compression is only advised in situations where message volume is low
and saving bytes over the wire is critical.

```js
let missive = require('missive');
let encode = missive.encode({ deflate: true });
let parse = missive.parse({ inflate: true });

parse.on( 'message', obj => {
  console.log( obj.foo ); // 'bar'
});

encode.write({ foo: 'bar' });
```

### Spec

In case you can't use `missive` on one side of a socket, this is
how it encodes data:

1. Let `data` be the result of `JSON.stringify( object ) + '\n'`.
2. Let `header` be the string `'JSON'` as a utf-8 string.
3. Let `byteLength` be the byte length of `data` as utf-8.
4. Let `buffer` be a new buffer of length `byteLength + 8`.
5. Write `header` at byte offset `0` of `buffer` as a UInt32LE.
6. Write `byteLength` at byte offset `4` of `buffer` as a UInt32LE.
7. Write `data` at byte offset `8` of `buffer` as a utf-8 string.
