var dof = require('../');
var fs = require('fs');
var macho = require('macho');

describe('DOF parser', function() {
  it('should parse node.js DOF section', function() {
    // Parse binary
    var m = macho.parse(fs.readFileSync(process.execPath));

    // Find DOF section
    var d = null;
    m.cmds.some(function(cmd) {
      if (cmd.type !== 'segment' && cmd.type !== 'segment_64')
        return false;

      if (cmd.name !== '__TEXT')
        return false;

      return cmd.sections.some(function(sect) {
        if (sect.sectname === '__dof_node' && sect.type === 'dtrace_dof') {
          d = sect.data;
          return true;
        }

        return false;
      });
    });

    // Parse it
    console.log(require('util').inspect(dof.parse(d), false, 300));
  });
});
