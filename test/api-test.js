var dof = require('../');
var fixtures = require('./fixtures');

describe('DOF parser', function() {
  it('should parse node.js DOF section', function() {
    var d = fixtures.getFile('ustack.raw');

    // Parse it
    d = dof.parse(d);
    console.log(require('util').inspect(d, false, 300));
  });
});
