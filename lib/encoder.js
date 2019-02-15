const Encoder  = require('fringe').Encoder;
const zlib     = require('zlib');
const defaults = require('./format');

class MessageEncoder extends Encoder {

  constructor( format = {}, options = {} ) {
    format  = Object.assign( {}, defaults, format );
    options = Object.assign( { objectMode: true }, options );
    super( format, options );
  }

  translate( obj ) {
    let buffer = Buffer.from( `${ JSON.stringify( obj ) }\n`, 'utf8' );

    if ( this.format.deflate ) {
      try {
        buffer = zlib.deflateSync( buffer );
      } catch ( err )  {
        this.emit( 'error', err );
      }
    }

    return buffer;
  }

}

module.exports = MessageEncoder;
