let Encoder = require('../../lib/encoder');
let Parser = require('../../lib/parser');
let encoder = new Encoder();
let parser = new Parser();

let data = { foo: 'bar', baz: 'bing' };

encoder.write( data );

let msg = encoder.read();

// make sure the stream isn't paused so that it
// won't buffer all these messages
parser.resume();

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
