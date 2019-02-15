const Parser   = require('fringe').Parser;
const zlib     = require('zlib');
const defaults = require('./format');

class MessageParser extends Parser {

  constructor( format = {}, options = {} ) {
    format  = Object.assign( {}, defaults, format );
    super( format, options );
  }

  translate( buffer ) {
    if ( this.format.inflate ) {
      try {
        buffer = zlib.inflateSync( buffer );
      } catch ( err ) {
        this.emit( 'error', err );
      }
    }

    return JSON.parse( buffer.toString('utf8') );
  }

}

module.exports = MessageParser;
