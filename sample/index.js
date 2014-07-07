var Funnel = require('../src/funnel'),
    config = require ('./config.js');

var server = new Funnel(config);
server.start();

console.log('Server started at http://localhost:' + server.get('port'));

