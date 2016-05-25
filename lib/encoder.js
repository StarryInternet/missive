'use strict';

const Transform = require('stream').Transform;
const HEADER    = require('./header');

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

  constructor() {
    // call parent constructor (allow passing objects)
    super({ objectMode: true });
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
    const json = `${ JSON.stringify( data ) }\n`;
    const byteLength = Buffer.byteLength( json, 'utf8' );
    const buffer = new Buffer( byteLength + 8 );

    buffer.writeUInt32LE( Encoder.HEADER, 0 );
    buffer.writeUInt32LE( byteLength, 4 );
    buffer.write( json, 8 );

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
