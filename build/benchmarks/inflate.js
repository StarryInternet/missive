let Encoder = require('../../lib/encoder');
let Parser = require('../../lib/parser');
let encoder = new Encoder({ deflate: true });
let parser = new Parser({ inflate: true });

let data = { foo: 'bar', baz: 'bing' };

encoder.write( data );

let msg = encoder.read();

// make sure the stream isn't paused so that it
// won't buffer all these messages
parser.resume();

module.exports = {
  name: 'Parse (inflate)',
  tests: [
    {
      name: 'Parse (inflate)',
      fn() {
        parser.write( msg );
      }
    }
  ]
};
