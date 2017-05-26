var chai = require('chai');

describe( 'Parser', function() {

  describe( '#constructor', function() {

    it( 'should be a function', function() {
      var Parser = require('rewire')('../../lib/parser');

      chai.assert.isFunction( Parser );
    });

    it( 'should inherit from stream.Transform', function() {
      var Parser = require('rewire')('../../lib/parser'),
        Transform = require('stream').Transform,
        parser = new Parser();

      chai.assert.instanceOf( parser, Transform );
    });

  });

  describe( '#_transform', function() {

    it( 'should emit `message` when it receives a fully-formed message', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj = { foo: 'bar' };

      encoder.pipe( parser ).on( 'message', function( msg ) {
        chai.assert.equal( msg.foo, 'bar' );
        // make sure it didn't just pass me back the same actual object
        chai.assert.notEqual( msg, obj );
        done();
      });

      encoder.write( obj );
    });

    it( 'should deflate/inflate messages', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser({ inflate: true }),
        encoder = new Encoder({ deflate: true }),
        obj = { foo: 'bar' };

      encoder.pipe( parser ).on( 'message', function( msg ) {
        chai.assert.equal( msg.foo, 'bar' );
        // make sure it didn't just pass me back the same actual object
        chai.assert.notEqual( msg, obj );
        done();
      });

      encoder.write( obj );
    });

    it( 'should accept strings', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj = { foo: 'bar' };

      encoder.on( 'data', function( chunk ) {
        parser._transform( chunk.toString('utf8'), null, function() {} );
      });

      parser.on( 'message', function( msg ) {
        chai.assert.equal( msg.foo, 'bar' );
        done();
      });

      encoder.write( obj );
    });

    it( 'should reassamble split messages', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj = { foo: 'bar' };

      encoder.on( 'data', function( chunk ) {
        // split *after* the header
        parser.write( chunk.slice( 0, 10 ) );
        parser.write( chunk.slice( 10 ) );
      });

      parser.on( 'message', function( msg ) {
        chai.assert.equal( msg.foo, 'bar' );
        done();
      });

      encoder.write( obj );
    });

    it( 'should reassamble chunks that were split in the middle of a header', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj = { foo: 'bar' };

      encoder.on( 'data', function( chunk ) {
        parser.write( chunk.slice( 0, 4 ) );
        parser.write( chunk.slice( 4 ) );
      });

      parser.on( 'message', function( msg ) {
        chai.assert.equal( msg.foo, 'bar' );
        done();
      });

      encoder.write( obj );
    });

    it( 'should reassamble chunks that were split TWICE in the middle of a header', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj = { foo: 'bar' };

      encoder.on( 'data', function( chunk ) {
        parser.write( chunk.slice( 0, 2 ) );
        parser.write( chunk.slice( 2, 6 ) );
        parser.write( chunk.slice( 6 ) );
      });

      parser.on( 'message', function( msg ) {
        chai.assert.equal( msg.foo, 'bar' );
        done();
      });

      encoder.write( obj );
    });

    it( 'should emit `error` when given a malformed message', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        parser = new Parser();

      parser.on( 'error', function( err ) {
        chai.assert.instanceOf( err, Error );
        done();
      });

      parser.write( new Buffer( 10 ) );
    });

    it( 'should emit `error` when given a buffer larger than MAX_LEN', function( done ) {
       var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj = { foo: 'bar' };

      encoder.on( 'data', function( chunk ) {
        // rewrite the `length` portion of the header
        chunk.writeUInt32LE( 1024 * 1024 + 1, 4 );
        parser.write( chunk );
      });

      parser.on( 'error', function( err ) {
        chai.assert.instanceOf( err, Error );
        done();
      });

      encoder.write( obj );
    });

    it( 'should separate multiple messages passed in the same chunk', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj1 = { foo: 'bar' },
        obj2 = { baz: 'bing' },
        buffer = new Buffer( 0 ),
        count = 0;

      encoder.on( 'data', function( chunk ) {
        buffer = Buffer.concat([ buffer, chunk ]);
        if ( ++count === 2 ) {
          count = 0;
          parser.write( buffer );
        }
      });

      parser.on( 'message', function( msg ) {
        if ( ++count === 1 ) {
          chai.assert.equal( msg.foo, 'bar' );
        } else {
          chai.assert.equal( msg.baz, 'bing' );
          done();
        }
      });

      encoder.write( obj1 );
      encoder.write( obj2 );
    });

    it( 'should emit an error for zero-length messages', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        parser = new Parser(),
        buffer = new Buffer( 8 );

      parser.on( 'error', function( err ) {
        chai.assert.instanceOf( err, Error );
        done();
      });

      buffer.writeUInt32LE( Parser.HEADER, 0 );
      buffer.writeUInt32LE( 0, 4 );
      parser.write( buffer );
    });

    it( 'should literally be able to parse messages one byte at a time', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj = { foo: 'bar' };

      encoder.on( 'data', function( chunk ) {
        var i = 0, len = chunk.length;
        for ( ; i < len; ++i ) {
          parser.write( chunk.slice( i, i + 1 ) );
        }
      });

      parser.on( 'message', function( msg ) {
        chai.assert.equal( msg.foo, 'bar' );
        done();
      });

      encoder.write( obj );
    });

    // write a message into Parser before binding a `message` handler
    // and make sure that it's there waiting for us
    //
    // missive previously suffered from an issue where messages written
    // prior to a `data`/`message` handler being bound would essentially be
    // thrown away
    it( 'should buffer until a message handler is bound', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj1 = { foo: 'bar' },
        obj2 = { baz: 'bing' };

      encoder.on( 'data', function( chunk ) {
        parser.write( chunk );

        // write happens asynchronously, so we need to wait
        // for the data to become readable
        setImmediate( () => {
          let msg1 = parser.read();

          chai.assert.isNotNull( msg1, 'message was not buffered while waiting for a handler to be bound' );

          msg1 = JSON.parse( msg1.toString('utf8') );

          parser.on( 'message', () => {
            let buffered = parser.read();
            chai.assert.isNull( buffered, 'stream buffer was not exhausted after `message` was emitted' );
            done();
          });

          encoder.write( obj2 );
        });
      });

      encoder.write( obj1 );
    });

    // messages should *not* be buffered if a `message` handler is bound
    it( 'should not buffer while a message handler is bound', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj = { foo: 'bar' };

      encoder.on( 'data', function( chunk ) {
        parser.write( chunk );

        parser.on( 'message', () => {} );

        // write happens asynchronously, so we need to wait
        // for the data to become readable
        setImmediate( () => {
          let msg = parser.read();

          chai.assert.isNull( msg, 'stream buffer was not cleared' );
          done();
        });
      });

      encoder.write( obj );
    });

    it( 'should emit `end` when `null` is pushed', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser(),
        encoder = new Encoder(),
        obj = { foo: 'bar' };

      // bind a message to make sure we trigger the null check
      parser.on( 'message', () => {} );

      encoder.on( 'data', function( chunk ) {
        parser.on( 'end', () => {
          chai.assert.ok( true );
          done();
        });

        parser.write( chunk );
        parser.push( null );
      });

      encoder.write( obj );
    });

    it( 'should emit `end` when `null` is pushed and inflate is enabled', function( done ) {
      var Parser = require('rewire')('../../lib/parser'),
        Encoder = require('rewire')('../../lib/encoder'),
        parser = new Parser({ inflate: true }),
        encoder = new Encoder({ deflate: true }),
        obj = { foo: 'bar' };

      // bind a message to make sure we trigger the null check
      parser.on( 'message', () => {} );

      encoder.on( 'data', function( chunk ) {
        parser.on( 'end', () => {
          chai.assert.ok( true );
          done();
        });

        parser.write( chunk );
        parser.push( null );
      });

      encoder.write( obj );
    });

  });

});
