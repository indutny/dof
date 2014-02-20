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
