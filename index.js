'use strict';

const Parser  = require('./lib/parser');
const Encoder = require('./lib/encoder');

module.exports.parse = () => new Parser();
module.exports.encode = () => new Encoder();
