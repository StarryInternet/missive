var chai = require('chai');

describe( 'encoder', function() {

  describe( '#constructor', function() {

    it( 'should be a function', function() {
      var Encoder = require('rewire')('../../lib/encoder');

      chai.assert.isFunction( Encoder );
    });

    it( 'should inherit from stream.Transform', function() {
      var Encoder = require('rewire')('../../lib/encoder'),
        Transform = Encoder.__get__('Transform'),
        encoder = new Encoder();

      chai.assert.instanceOf( encoder, Transform );
    });

  });

  describe( '#_transform', function() {

    it( 'accept an object and return a JSON string with header', function( done ) {
      var Encoder = require('rewire')('../../lib/encoder'),
        encoder = new Encoder(),
        obj = {foo: 'bar'};

      encoder.on( 'data', function( chunk ) {
        var header = chunk.readUInt32LE( 0 ),
          len = chunk.readUInt32LE( 4 );
        chai.assert.equal( header, Encoder.HEADER );
        chai.assert.equal( len, 14 );
        done();
      });

      encoder.write( obj );
    });

  });

});
