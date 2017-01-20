let Encoder = require('../../lib/encoder');
let encoder = new Encoder();

let data = { foo: 'bar', baz: 'bing' };

// make sure the stream isn't paused so that it
// won't buffer all these messages
encoder.resume();

module.exports = {
  name: 'Encode',
  tests: [
    {
      name: 'Encode',
      fn() {
        encoder.write( data );
      }
    }
  ]
};
