var Metron = require('../src/metron');
var config = require('./config.js');

var server = new Metron(config);
server.start();

console.log('Server started at http://localhost:' + server.get('port'));
