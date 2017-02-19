'use strict';

const Transform = require('stream').Transform;
const HEADER    = require('./header');
const zlib      = require('zlib');

/**
 * Encoder class.
 *
 * Inherits from stream.Transform, and implements both stream.readable
 * and stream.writable.
 *
 * Emites byte streams of JSON messages in the format:
 *
 * {UInt32LE} 1313821514      - binary representation of the string 'JSON'
 * {UInt32LE} JSON_byteLength - length of JSON payload, in bytes
 * {String}   json_payload    – json (to be read out as utf8 string)
 */

class Encoder extends Transform {

  /**
   * Encoder constructor.
   *
   * @return {Encoder}
   */

  constructor( opts = {} ) {
    // call parent constructor (allow passing objects)
    super({ objectMode: true });

    if ( opts.deflate ) {
      this._deflate = zlib.deflate;
    }
  }

  /**
   * All stream.Transform subclasses have to implement a `_transform`
   * method that accepts `write` data and modifies it before it gets read.
   *
   * In this case, that means accepting a JavaScript object, serializing
   * it to JSON, and adding the headers described above.
   *
   * @param  {Object}   data     – JS object or array
   * @param  {String}   encoding – ignored
   * @param  {Function} done     – callback
   * @return {Undefined}
   */

  _transform( data, encoding, done ) {
    const enc = this._deflate ? 'base64' : 'utf8';

    let json = `${ JSON.stringify( data ) }\n`;

    if ( this._deflate ) {
      json = zlib.deflateSync( json ).toString( enc );
    }

    const byteLength = Buffer.byteLength( json, enc );
    const buffer = Buffer.allocUnsafe( byteLength + 8 ).fill( 0 );

    buffer.writeUInt32LE( Encoder.HEADER, 0 );
    buffer.writeUInt32LE( byteLength, 4 );
    buffer.write( json, 8, enc );

    this.push( buffer );

    done();
  }

  /**
   * Message delimiter (UInt32LE representation of the string 'JSON')
   *
   * @return {Number}
   */

  static get HEADER() {
    return HEADER;
  }

}

module.exports = Encoder;
