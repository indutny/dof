var dof = exports;

dof.constants = require('./dof/constants');
dof.Parser = require('./dof/parser');

dof.parse = function parse(buf) {
  return new dof.Parser().execute(buf);
};
