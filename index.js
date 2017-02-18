'use strict';

const Parser  = require('./lib/parser');
const Encoder = require('./lib/encoder');

module.exports.parse = opts => new Parser( opts );
module.exports.encode = opts => new Encoder( opts );
