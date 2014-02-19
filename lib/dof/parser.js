var assert = require('assert');

var dof = require('../dof');
var constants = dof.constants;

function Parser() {
  this.encoding = null;
  this.version = null;
};
module.exports = Parser;

Parser.prototype.mapFlags = function mapFlags(value, map) {
  var res = {};

  for (var bit = 1; (value < 0 || bit <= value) && bit !== 0; bit <<= 1)
    if (value & bit)
      res[map[bit]] = true;

  return res;
};

// Endian helpers

Parser.prototype.readUInt16 = function readUInt16(buf, offset) {
  if (this.encoding === 'lsb')
    return buf.readUInt16LE(offset);
  else
    return buf.readUInt16BE(offset);
};

Parser.prototype.readInt16 = function readInt16(buf, offset) {
  if (this.encoding === 'lsb')
    return buf.readInt16LE(offset);
  else
    return buf.readInt16BE(offset);
};

Parser.prototype.readUInt32 = function readUInt32(buf, offset) {
  if (this.encoding === 'lsb')
    return buf.readUInt32LE(offset);
  else
    return buf.readUInt32BE(offset);
};

Parser.prototype.readInt32 = function readInt32(buf, offset) {
  if (this.encoding === 'lsb')
    return buf.readInt32LE(offset);
  else
    return buf.readInt32BE(offset);
};

Parser.prototype.readUInt64 = function readUInt64(buf, offset) {
  var a = this.readUInt32(buf, offset);
  var b = this.readUInt32(buf, offset + 4);
  if (this.encoding === 'lsb')
    return a + b * 0x100000000;
  else
    return b + a * 0x100000000;
};

Parser.prototype.readInt64 = function readInt64(buf, offset) {
  if (this.encoding === 'lsb') {
    var a = this.readUInt32(buf, offset);
    var b = this.readInt32(buf, offset + 4);
    return a + b * 0x100000000;
  } else {
    var a = this.readInt32(buf, offset);
    var b = this.readUInt32(buf, offset + 4);
    return b + a * 0x100000000;
  }
};

// Parser itself

Parser.prototype.execute = function execute(buf) {
  if (buf.length < 16)
    throw new Error('DOF id OOB');

  var magic = buf.readUInt32LE(0);
  if (magic !== 0x464F447F)
    throw new Error('Invalid magic value');

  var model = constants.model[buf[4]];
  var encoding = constants.encoding[buf[5]];
  assert(encoding !== 'none', 'Invalid encoding');

  var version = constants.version[buf[6]];
  var dif = {
    version: buf[7],
    ireg: buf[8],
    treg: buf[9]
  };

  for (var i = 10; i < 16; i++)
    assert.equal(buf[i], 0, 'Incorrect padding bytes');

  // Set encoding for later use
  this.encoding = encoding;

  var hdr = this.parseHeader(buf.slice(16));
  hdr.model = model;
  hdr.encoding = encoding;
  hdr.dif = dif;
  hdr.version = version;

  hdr.sections = this.parseSections(hdr, buf.slice(hdr.hdrsize), buf);

  return hdr;
};

Parser.prototype.parseHeader = function parseHeader(buf) {
  return {
    model: null,
    encoding: null,
    dif: null,
    version: null,

    flags: this.readUInt32(buf, 0),
    hdrsize: this.readUInt32(buf, 4),
    secsize: this.readUInt32(buf, 8),
    secnum: this.readUInt32(buf, 12),
    secoff: this.readUInt32(buf, 16),
    loadsz: this.readUInt32(buf, 20),
    filesz: this.readUInt32(buf, 24),

    sections: null
  };
};

Parser.prototype.parseSections = function parseSections(hdr, buf, raw) {
  var sections = [];
  for (var i = 0, offset = 0; i < hdr.secnum; i++, offset += hdr.secsize) {
    if (offset + hdr.secsize > buf.length)
      throw new Error('Section OOB');

    sections.push(this.parseSection(buf.slice(offset, offset + hdr.secsize),
                                    raw));
  }
  return sections;
};

Parser.prototype.parseSection = function parseSection(buf, raw) {
  if (buf.length < 32)
    throw new Error('Section is too small');

  var type = constants.sectType[this.readUInt32(buf, 0)];
  var align = this.readUInt32(buf, 4);
  var flags = this.mapFlags(this.readUInt32(buf, 8), constants.sectFlags);
  var entsize = this.readUInt32(buf, 12);
  var offset = this.readUInt64(buf, 16);
  var size = this.readUInt64(buf, 24);

  if (offset + size > raw.length)
    throw new Error('Section data OOB');

  var data = raw.slice(offset, offset + size);

  return {
    type: type,
    align: align,
    flags: flags,
    entsize: entsize,
    offset: offset,
    size: size,

    data: data
  };
};
