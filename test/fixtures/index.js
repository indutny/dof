var fs = require('fs');
var path = require('path');

exports.getFile = function getFile(name) {
  return fs.readFileSync(path.resolve(__dirname, name));
};
