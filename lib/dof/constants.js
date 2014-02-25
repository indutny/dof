var constants = exports;

constants.model = {
  0: 'none',
  1: 'ilp32',
  2: 'lp64'
};

constants.encoding = {
  0: 'none',
  1: 'lsb',
  2: 'msb'
};

constants.version = {
  1: 'v1',
  2: 'v2',
  3: 'v3'
};

constants.sectType = {
  0: 'none',
  1: 'comments',
  2: 'source',
  3: 'ecbdesc',
  4: 'probedesc',
  5: 'actdesc',
  6: 'difohdr',
  7: 'dif',
  8: 'strtab',
  9: 'vartab',
  10: 'reltab',
  11: 'typtab',
  12: 'urelhdr',
  13: 'krelhdr',
  14: 'optdesc',
  15: 'provider',
  16: 'probes',
  17: 'prargs',
  18: 'proffs',
  19: 'inttab',
  20: 'utsname',
  21: 'xltab',
  22: 'xlmembers',
  23: 'xlimport',
  24: 'xlexport',
  25: 'prexport',
  26: 'prenoffs'
};

constants.sectFlags = {
  1: 'load'
};

constants.reltabType = {
  0: 'none',
  1: 'setx'
};

constants.stability = {
  0: 'internal',
  1: 'private',
  2: 'obsolete',
  3: 'external',
  4: 'unstable',
  5: 'evolving',
  6: 'stable',
  7: 'standard'
};

constants.class = {
  0: 'unknown',
  1: 'cpu',
  2: 'platform',
  3: 'group',
  4: 'isa',
  5: 'common'
};

constants.actKind = {
  0: 'none',
  1: 'difexpr',
  2: 'exit',
  3: 'printf',
  4: 'printa',
  5: 'libact',

  50: 'applybinary',

  0x100: 'proc',
  0x101: 'ustack',
  0x102: 'jstack',
  0x103: 'usym',
  0x104: 'umod',
  0x105: 'uaddr',

  0x200: 'proc_destructive',
  0x201: 'stop',
  0x202: 'raise',
  0x203: 'system',
  0x204: 'freopen',

  // Apple-specific
  0x232: 'pidresume',
  0x300: 'proc_control',

  0x400: 'kernel',
  0x401: 'stack',
  0x402: 'sym',
  0x403: 'mod',

  0x500: 'kernel_destructive',
  0x501: 'breakpoint',
  0x502: 'panic',
  0x503: 'chill',

  0x600: 'speculative',
  0x601: 'speculate',
  0x602: 'commit',
  0x603: 'discard',

  0x700: 'aggregation',
  0x701: 'count',
  0x702: 'min',
  0x703: 'max',
  0x704: 'avg',
  0x705: 'sum',
  0x706: 'stddev',
  0x707: 'quantize',
  0x708: 'lquantize',
  0x709: 'llquantize'
};

constants.difTypeKind = {
  0: 'ctf',
  1: 'string'
};

constants.difTypeFlags = {
  1: 'byref'
};

constants.difVarKind = {
  0: 'array',
  1: 'scalar'
};

constants.difVarScope = {
  0: 'global',
  1: 'thread',
  2: 'local'
};

constants.difVarFlags = {
  1: 'ref',
  2: 'mod'
};
