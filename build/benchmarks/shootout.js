global.require = require;

module.exports = {
  name: 'Parsing Shootout',
  tests: [
    {
      name: 'missive',
      setup() {
        let Encoder = require('../../lib/encoder');
        let Parser = require('../../lib/parser');
        let encoder = new Encoder();
        let missiveStream = new Parser();
        let data = { foo: 'bar', baz: 'bing' };
        encoder.write( data );
        let missiveJSON = encoder.read();
        let noop = () => {};
        missiveStream.on( 'message', noop );
      },
      fn() {
        missiveStream.write( missiveJSON );
      }
    },
    {
      name: 'json-stream',
      setup() {
        let JSONStream = require('json-stream');
        let jsonStream = new JSONStream();
        let data = { foo: 'bar', baz: 'bing' };
        let newlineJSON = JSON.stringify( data + '\n' );
        let noop = () => {};
        jsonStream.on( 'data', noop );
      },
      fn() {
        jsonStream.write( newlineJSON );
      }
    },
    {
      name: 'ldjson-stream',
      setup() {
        let ldjson = require('ldjson-stream');
        let ldjsonStream = ldjson.parse();
        let encode = ldjson.serialize();
        let data = { foo: 'bar', baz: 'bing' };
        encode.write( data );
        let newlineJSON = encode.read();
        let noop = () => {};
        ldjsonStream.on( 'data', noop );
      },
      fn() {
        ldjsonStream.write( newlineJSON );
      }
    },
    {
      name: 'burro',
      setup() {
        let Encoder = require('burro/lib/encoder');
        let Framer = require('burro/lib/framer');
        let Unframer = require('burro/lib/unframer');
        let Decoder = require('burro/lib/decoder');
        let encoder = new Encoder();
        let framer = new Framer();
        let burroUnframerStream = new Unframer();
        let burroDecoderStream = new Decoder();
        let data = { foo: 'bar', baz: 'bing' };
        encoder.write( data );
        framer.write( encoder.read() );
        let burroJSON = framer.read();
        let noop = () => {};
        burroUnframerStream.pipe( burroDecoderStream );
        burroDecoderStream.on( 'data', noop );
      },
      fn() {
        burroUnframerStream.write( burroJSON );
      }
    }
  ]
};
