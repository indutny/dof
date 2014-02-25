var assert = require('assert');
var util = require('util');
var Reader = require('endian-reader');

var dof = require('../dof');
var constants = dof.constants;

function Parser() {
  Reader.call(this);

  this.version = null;
};
util.inherits(Parser, Reader);
module.exports = Parser;

Parser.prototype.mapFlags = function mapFlags(value, map) {
  var res = {};

  for (var bit = 1; (value < 0 || bit <= value) && bit !== 0; bit <<= 1)
    if (value & bit)
      res[map[bit]] = true;

  return res;
};

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
  this.setEndian(encoding);

  var hdr = this.parseHeader(buf.slice(16));
  hdr.model = model;
  hdr.encoding = encoding;
  hdr.dif = dif;
  hdr.version = version;

  hdr.sections = this.parseSections(hdr, buf.slice(hdr.hdrsize), buf);

  this.resolveSections(hdr.sections);

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

Parser.prototype.parseCStr = function parseCStr(data) {
  for (var i = 0; i < data.length && data[i] != 0; i++);
  return data.slice(0, i).toString();
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

  var data = this.parseRaw(raw.slice(offset, offset + size), entsize);

  if (type === 'probes')
    data = this.parseProbes(data);
  else if (type === 'probedesc')
    data = this.parseProbeDesc(data);
  else if (type === 'provider')
    data = this.parseProvider(data);
  else if (type === 'reltab')
    data = this.parseReltab(data);
  else if (type === 'urelhdr' || type === 'krelhdr')
    data = this.parseRelhdr(data);
  else if (type === 'comments' || type === 'utsname')
    data = this.parseCStr(data);
  else if (type === 'actdesc')
    data = this.parseActDesc(data);
  else if (type === 'vartab')
    data = this.parseVarTab(data);
  else if (type === 'difohdr')
    data = this.parseDifoHdr(data);
  else if (type === 'ecbdesc')
    data = this.parseEcbDesc(data);

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

Parser.prototype.parseRaw = function parseRaw(buf, entsize) {
  if (entsize <= 1)
    return buf;

  if (buf.length % entsize !== 0)
    throw new Error('Invalid raw section length');

  var results = [];

  for (var off = 0; off < buf.length; off += entsize) {
    if (entsize === 2)
      results.push(this.readUInt16(buf, off));
    else if (entsize === 4)
      results.push(this.readUInt32(buf, off));
    else if (entsize === 8)
      results.push(this.readUInt64(buf, off));
    else
      results.push(buf.slice(off, off + entsize));
  }

  return results;
};

Parser.prototype.parseProbes = function parseProbes(entities) {
  return entities.map(function(ent) {
    if (ent.length < 48)
      throw new Error('probe is too small');

    return {
      addr: ent.slice(0, 8),
      func: this.readUInt32(ent, 8),
      name: this.readUInt32(ent, 12),
      nargv: this.readUInt32(ent, 16),
      xargv: this.readUInt32(ent, 20),
      argidx: this.readUInt32(ent, 24),
      offidx: this.readUInt32(ent, 28),
      nargc: this.readUInt8(ent, 32),
      xargc: this.readUInt8(ent, 33),
      noffs: this.readUInt16(ent, 34),
      enoffidx: this.readUInt32(ent, 36),
      nenoffs: this.readUInt16(ent, 40)
    };
  }, this);
};

Parser.prototype.parseProbeDesc = function parseProbeDesc(entities) {
  return entities.map(function(ent) {
    if (ent.length < 24)
      throw new Error('probedesc is too small');

    return {
      strtab: this.readInt32(ent, 0),
      provider: this.readUInt32(ent, 4),
      mod: this.readUInt32(ent, 8),
      func: this.readUInt32(ent, 12),
      name: this.readUInt32(ent, 16),
      id: this.readUInt32(ent, 20)
    };
  }, this);
};

Parser.prototype.parseProvider = function parseProvider(provider) {
  if (provider.length < 44)
    throw new Error('Provider is too small');

  function attr(val) {
    return {
      name: constants.stability[(val >> 24) & 0xff],
      data: constants.stability[(val >> 16) & 0xff],
      class: constants.class[(val >> 8) & 0xff]
    };
  }

  return {
    strtab: this.readInt32(provider, 0),
    probes: this.readInt32(provider, 4),
    prargs: this.readInt32(provider, 8),
    proffs: this.readInt32(provider, 12),
    name: this.readUInt32(provider, 16),
    provattr: attr(this.readUInt32(provider, 20)),
    modattr: attr(this.readUInt32(provider, 24)),
    funcattr: attr(this.readUInt32(provider, 28)),
    nameattr: attr(this.readUInt32(provider, 32)),
    argsattr: attr(this.readUInt32(provider, 36)),
    prenoffs: this.readUInt32(provider, 40)
  };
};

Parser.prototype.parseReltab = function parseReltab(reltab) {
  return reltab.map(function(reltab) {
    if (reltab.length !== 24)
      throw new Error('Invalid reltab size');

    return {
      name: this.readUInt32(reltab, 0),
      type: constants.reltabType[this.readUInt32(reltab, 4)],
      offset: this.readUInt64(reltab, 8),
      data: reltab.slice(16, 24)
    };
  }, this);
};

Parser.prototype.parseRelhdr = function parseRelhdr(rel) {
  if (rel.length !== 12)
    throw new Error('Invalid relhdr size');

  return {
    strtab: this.readInt32(rel, 0),
    relsec: this.readInt32(rel, 4),
    tgtsec: this.readInt32(rel, 8)
  };
};

Parser.prototype.parseActDesc = function parseActDesc(ad) {
  return ad.map(function(ad) {
    if (ad.length !== 32)
      throw new Error('Invalid actdesc size');

    return {
      difo: this.readInt32(ad, 0),
      strtab: this.readInt32(ad, 4),
      kind: constants.actKind[this.readUInt32(ad, 8)],
      ntuple: this.readUInt32(ad, 12),
      arg: this.readUInt64(ad, 16),
      uarg: this.readUInt64(ad, 24)
    };
  }, this);
};

Parser.prototype.parseVarTab = function parseVarTab(vt) {
  return vt.map(function(vt) {
    if (vt.length !== 20)
      throw new Error('Invalid vartab size');

    return {
      name: this.readUInt32(vt, 0),
      id: this.readUInt32(vt, 4),
      kind: constants.difVarKind[this.readInt8(vt, 8)],
      scope: constants.difVarScope[this.readInt8(vt, 9)],
      flags: this.mapFlags(this.readInt16(vt, 10), constants.difVarFlags),
      type: this.parseDifType(vt.slice(12))
    };
  }, this);
};

Parser.prototype.parseDifType = function parseDifType(dt) {
  if (dt.length < 8)
    throw new Error('Invalid diftype size');

  return {
    kind: constants.difTypeKind[this.readInt8(dt, 0)],
    ckind: this.readInt8(dt, 1),
    flags: this.mapFlags(this.readInt8(dt, 2), constants.difTypeFlags),
    size: this.readUInt32(dt, 4)
  };
};

Parser.prototype.parseDifoHdr = function parseDifoHdr(dh) {
  return {
    type: this.parseDifType(dh),
    links: this.parseRaw(dh.slice(8), 4)
  };
};

Parser.prototype.parseEcbDesc = function parseEcbDesc(eb) {
  if (eb.length !== 24)
    throw new Error('Invalid ecbdesc length');

  return {
    probes: this.readInt32(eb, 0),
    pred: this.readInt32(eb, 4),
    actions: this.readInt32(eb, 8),
    uarg: this.readUInt64(eb, 12)
  };
};

// Resolver

Parser.prototype.resolveSections = function resolveSections(sections) {
  for (var i = 0; i < sections.length; i++) {
    var sect = sections[i];

    if (sect.type === 'probedesc')
      this.resolveProbeDesc(sect, sections);
    else if (sect.type === 'provider')
      this.resolveProvider(sect, sections);

    // TODO(indutny): or kernel relocations? provide option
    else if (sect.type === 'urelhdr')
      this.resolveRelhdr(sect, sections);

    else if (sect.type === 'ecbdesc')
      this.resolveEcbDesc(sect, sections);
  }
};

Parser.prototype.resolveStr = function resolveStr(strtab, off) {
  for (var i = off; i < strtab.length && strtab[i] != 0; i++);

  return strtab.slice(off, i).toString();
};

Parser.prototype.resolveStrs = function resolveStr(strtab, off, count) {
  var res = [];
  for (var j = 0; j < count; j++) {
    for (var i = off; i < strtab.length && strtab[i] != 0; i++);

    res.push(strtab.slice(off, i).toString());
    off = i + 1;
  }
  return res;
};

Parser.prototype.resolveProbeDesc = function resolveProbeDesc(sect, sections) {
  for (var i = 0; i < sect.data.length; i++) {
    var probe = sect.data[i];
    var strtab = sections[probe.strtab];
    if (!strtab || strtab.type !== 'strtab')
      throw new Error('Unknown strtab is used in probedesc section');

    probe.strtab = strtab.data;
    probe.provider = this.resolveStr(probe.strtab, probe.provider);
    probe.mod = this.resolveStr(probe.strtab, probe.mod);
    probe.func = this.resolveStr(probe.strtab, probe.func);
    probe.name = this.resolveStr(probe.strtab, probe.name);
  }
};

Parser.prototype.resolveProvider = function resolveProvider(sect, sections) {
  var strtab = sections[sect.data.strtab];
  var probes = sections[sect.data.probes];
  var prargs = sections[sect.data.prargs];
  var proffs = sections[sect.data.proffs];
  var prenoffs = sections[sect.data.prenoffs];
  if (!strtab || strtab.type !== 'strtab')
    throw new Error('Unknown strtab is used in provider section');
  if (!probes || probes.type !== 'probes')
    throw new Error('Unknown probes is used in provider section');
  if (!prargs || prargs.type !== 'prargs')
    throw new Error('Unknown prargs is used in provider section');
  if (!proffs || proffs.type !== 'proffs')
    throw new Error('Unknown proffs is used in provider section');
  if (!prenoffs || prenoffs.type !== 'prenoffs')
    throw new Error('Unknown prenoffs is used in provider section');

  sect.data.strtab = strtab.data;
  sect.data.probes = probes.data;
  sect.data.prargs = prargs.data;
  sect.data.proffs = proffs.data;
  sect.data.prenoffs = prenoffs.data;

  sect.data.name = this.resolveStr(strtab.data, sect.data.name);

  // Resolve probes
  for (var i = 0; i < sect.data.probes.length; i++)
    this.resolveProbe(sect.data.probes[i], sect.data);
};

Parser.prototype.resolveProbe = function resolveProbe(probe, provider) {
  probe.func = this.resolveStr(provider.strtab, probe.func);
  probe.name = this.resolveStr(provider.strtab, probe.name);
  probe.nargv = this.resolveStrs(provider.strtab, probe.nargv, probe.nargc);
  probe.xargv = this.resolveStrs(provider.strtab, probe.xargv, probe.xargc);

  probe.args = provider.prargs.slice(probe.argidx, probe.argidx + probe.nargc);
  probe.offs = provider.proffs.slice(probe.offidx, probe.offidx + probe.noffs);
  probe.enoffs = provider.prenoffs.slice(probe.enoffidx,
                                         probe.enoffidx + probe.nenoffs);
};

Parser.prototype.resolveRelhdr = function resolveRelhdr(sect, sections) {
  var strtab = sections[sect.data.strtab];
  var rel = sections[sect.data.relsec];
  var tgt = sections[sect.data.tgtsec];
  if (!strtab || strtab.type !== 'strtab')
    throw new Error('Unknown strtab is used in relhdr');
  if (!rel || rel.type !== 'reltab')
    throw new Error('Unknown reltab is used in relhdr');
  if (!tgt)
    throw new Error('Unknown tgtsec is used in relhdr');

  sect.data.strtab = strtab.data;
  sect.data.relsec = rel.data;
  sect.data.tgtsec = tgt.data;

  this.resolveReltab(rel, sect.data);

  // Attach relocation data
  for (var i = 0; i < rel.data.length; i++) {
    assert.equal(rel.data[i].offset % tgt.entsize, 0);
    var off = rel.data[i].offset / tgt.entsize;
    if (tgt.data[off].relocation)
      tgt.data[off].relocation.push(rel.data[i]);
    else
      tgt.data[off].relocation = [ rel.data[i] ];
  }
};

Parser.prototype.resolveReltab = function resolveReltab(reltab, relhdr) {
  for (var i = 0; i < reltab.data.length; i++) {
    var rel = reltab.data[i];

    rel.name = this.resolveStr(relhdr.strtab, rel.name);
  }
};

Parser.prototype.resolveEcbDesc = function resolveEcbDesc(ebd, sections) {
  var eb = ebd.data;
  var probes = sections[eb.probes];
  var pred = sections[eb.pred];
  var actions = sections[eb.actions];
  if (!probes || probes.type !== 'probedesc')
    throw new Error('Unknown probedesc is used in ecbdesc');
  if (eb.pred !== -1 && (!pred || pred.type !== 'difohdr'))
    throw new Error('Unknown difohdr is used in ecbdesc');
  if (!actions || actions.type !== 'actdesc')
    throw new Error('Unknown actdesc is used in ecbdesc');

  eb.probes = probes.data;
  eb.pred = pred ? pred.data : null;
  eb.actions = actions.data;
};
