let Encoder = require('../../lib/encoder');
let encoder = new Encoder({ deflate: true });

let data = { foo: 'bar', baz: 'bing' };

// make sure the stream isn't paused so that it
// won't buffer all these messages
encoder.resume();

module.exports = {
  name: 'Encode (deflate)',
  tests: [
    {
      name: 'Encode (deflate)',
      fn() {
        encoder.write( data );
      }
    }
  ]
};
