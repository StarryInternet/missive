let Encoder = require('../../lib/encoder');
let Parser = require('../../lib/parser');
let encoder = new Encoder();
let parser = new Parser();

let data = { foo: 'bar', baz: 'bing' };

encoder.write( data );

let msg = encoder.read();

// make sure we pay for JSON parsing to make this fair
parser.on( 'message', () => {} );

module.exports = {
  name: 'Parse',
  tests: [
    {
      name: 'Parse',
      fn() {
        parser.write( msg );
      }
    }
  ]
};
