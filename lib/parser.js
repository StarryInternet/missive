'use strict';

const Transform = require('stream').Transform;
const HEADER    = require('./header');
const zlib      = require('zlib');
const MAX_LEN   = 1024 * 1024;

/**
 * Parser class.
 *
 * Inherits from stream.Transform, and implements both stream.readable
 * and stream.writable.
 *
 * Receives byte streams of JSON messages in the format:
 */

class Parser extends Transform {

  /**
   * Parser constructor.
   *
   * @return {Parser}
   */

  constructor( opts = {} ) {
    // call parent constructor
    super();
    // buffered JSON data
    this._buffer = null;
    // expected message length
    this._bufLen = 0;
    // amount of filled bytes in the buffer
    this._bOffset = 0;
    // temporary buffer for header + length
    this._hBuf = Buffer.alloc( 8 );
    // amount of filled bytes in the header buffer
    this._hOffset = 0;

    if ( opts.inflate ) {
      this._inflate = opts.inflate;
    }
  }

  /**
   * stream.Readable treats `data` as a "magic" event name and automatically
   * resumes the stream when a `data` handler is bound.
   *
   * Since we want to allow missive users to bind only to `message` (without
   * needing to subscribe to `data`), we do the same thing with
   * `message` handlers.
   *
   * @param  {String} ev – event name
   * @param  {String} fn – callback function
   * @return {Parser}
   */

  on( ev, fn ) {
    let res = super.on( ev, fn );

    if ( ev === 'message' && !this.isPaused() ) {
      this.resume();
    }

    return res;
  }

  /**
   * All stream.Transform subclasses have to implement a `_transform`
   * method that accepts `write` data and modifies it before it gets read.
   *
   * In our case, that means reading the custom header and buffering
   * the byte stream until we get a fully-formed JSON message.
   *
   * @param  {Object}   chunk    – Buffer instance (or string)
   * @param  {String}   encoding – optional string encoding
   * @param  {Function} done     – callback
   * @return {Undefined}
   */

  _transform( chunk, encoding, done ) {
    let offset = 0;
    let length = chunk.length;

    if ( typeof chunk === 'string' ) {
      chunk = Buffer.from( chunk, encoding || 'utf8' );
    }

    while ( true ) {
      // nothing buffered means we're ready for a brand new message
      if ( this._bufLen === 0 ) {

        // read header data, update offset or break if we exhausted the chunk
        if ( !( offset = this._readHeaderBytes( chunk, length, offset ) ) ) {
          break;
        }

        this._startMessage();
      }

      // read message bytes. get new offset if there's additional data in the
      // chunk, otherwise break
      if ( !( offset = this._readMessageBytes( chunk, length, offset ) ) ) {
        break;
      }
    }

    done();
  }

  /**
   * Read header bytes, copy them, and return a new byte offset if we got a
   * complete header, otherwise return false.
   * @param  {Object} chunk   – chunk buffer
   * @param  {Number} offset  – chunk byte length
   * @param  {Number} offset  – chunk byte offset
   * @return {Number|Boolean} – new byte offset (or false if chunk exhausted)
   */

  _readHeaderBytes( chunk, length, offset ) {
    let added = Math.min( 8 - this._hOffset, length - offset );

    chunk.copy( this._hBuf, this._hOffset, offset, offset + added );
    this._hOffset += added;

    // have incomplete header data?
    if ( this._hOffset < 8 ) {
      return false;
    }
    // read the header and message length
    this._foundHeader = this._hBuf.readUInt32LE( 0 ) === Parser.HEADER;
    this._bufLen = this._hBuf.readUInt32LE( 4 );

    if ( this._hasError() ) {
      this._clear();
      return false;
    }

    return offset + added;
  }

  /**
   * Setup routine for new messages.
   *
   * Create a new backing store, update offsets, and set a message timout.
   * @return {Undefined}
   */

  _startMessage() {
    // allocUnsafe + fill is faster than alloc because `unsafe`
    // will grab memory from the buffer pool, but alloc won't
    this._buffer = Buffer.allocUnsafe( this._bufLen ).fill( 0 );
    this._bOffset = 0;
    this._hOffset = 0;
  }

  /**
   * Private method for checking the current status of a stream
   * @return {Boolean} do we have an error?
   */

  _hasError() {
    // missing/invalid header
    if ( !this._foundHeader ) {
      this.emit( 'error', new Error('No message header found') );
      return true;
    }
    // basic DoS prevention
    if ( this._bufLen > Parser.MAX_LEN ) {
      this.emit( 'error', new Error('Maximum message length exceeded') );
      return true;
    }
    // zero-length message
    if ( this._bufLen === 0 ) {
      this.emit( 'error', new Error('Zero-length message received') );
      return true;
    }
    return false;
  }

  /**
   * Read bytes from the chunk into the backing store.
   *
   * Returns a new byte offset if there's data leftover,
   * otherwise returns false.
   * @param  {Object} chunk   – chunk buffer
   * @param  {Number} offset  – chunk byte length
   * @param  {Number} offset  – chunk byte offset
   * @return {Number|Boolean} – new byte offset (or false if chunk exhausted)
   */

  _readMessageBytes( chunk, length, offset ) {
    let bufRemaining = this._bufLen - this._bOffset;
    let chunkRemaining = length - offset;

    // end of the chunk and we're still expecting more data
    if ( chunkRemaining < bufRemaining ) {
      chunk.copy( this._buffer, this._bOffset, offset, length );
      this._bOffset += chunkRemaining;
      return false;
    }

    // complete the current message
    chunk.copy( this._buffer, this._bOffset, offset, offset + bufRemaining );
    this.push( this._buffer );

    // no more data in this chunk
    if ( chunkRemaining === bufRemaining ) {
      return false;
    }

    return offset + bufRemaining;
  }

  /**
   * Private convenience method for resetting parser state between messages.
   * @return {Undefined}
   */

  _clear() {
    this._foundHeader = false;
    this._bufLen = 0;
    this._buffer = null;
  }

  /**
   * Override native `push` to do some cleanup and emit `message` events
   *
   * This is the method that actually makes data readable via `pipe()`
   * or `.on( 'data' )`.
   *
   * @param  {Object} buffer – buffer representation of a JSON string
   * @return {Undefined}
   */

  push( buffer ) {
    this._clear();

    if ( this._inflate ) {
      buffer = zlib.inflateSync( buffer );
    }

    super.push( buffer );

    // don't pay for JSON parsing if nobody's listening
    if ( buffer !== null && this.listenerCount('message') !== 0 ) {
      this.emit( 'message', JSON.parse( buffer.toString('utf8') ) );
    }
  }

  /**
   * Maximum byte length we'll accept for messages (prevent DoS).
   *
   * @return {Number}
   */

  static get MAX_LEN() {
    return MAX_LEN;
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

module.exports = Parser;
