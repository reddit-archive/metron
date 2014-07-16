/* jshint strict:false */

var http = require('http');
var url = require('url');
var qs = require('querystring');
var Parameter = require('./parameter');

var defaultConfig = {
  segments: [],
  port: 8000
};

function Metron(config){
  this.config = config || {};
  this.set(config);
}

Metron.prototype.get = function(key){
  return this.config[key];
}

Metron.prototype.set = function(obj){
  for(var key in defaultConfig){
    this.config[key] =
      [obj[key], this.config[key], defaultConfig[key]].filter(function(v){
        return v !== undefined
      })[0];
  }

  return this.config;
}

Metron.prototype.start = function(){
  var server  = http.createServer(this.processRequest.bind(this));
  this.server = server;

  server.listen(this.get('port'));
}

Metron.prototype.stop = function(){
  this.server.close();
}

Metron.prototype.processRequest = function(req, res){
  var params = { };
  var parsedUrl = url.parse(req.url, true);

  if(req.method === 'GET'){
    try{
      params = JSON.parse(parsedUrl.query.data);
    }catch(e){
      return this.endRequest(req, res, 400);
    }

    this.processParameters(params, req, res);
  }else{
    var body = [];

    req.on('data', function (data) {
      body.push(data.toString());
    });

    req.on('end', function () {
      body = body.join('');

      if(req.headers['Content-Type'].toLowerCase().indexOf('json') > -1){
        try{
          params = JSON.parse(body);
        }catch(e){
          return this.endRequest(req, res, 400);
        }
      }else{
        params = qs.parse(body);
      }

      this.processParameters(params, req, res);
    });
  }
}

Metron.prototype.endRequest = function(req, res, statusCode){
  res.writeHead(statusCode || 204);
  res.end();
};

Metron.prototype.processParameters = function(params, req, res){
  for(var segmentName in params){
    var segmentConfig = this.config.segments[segmentName];
    var segment = params[segmentName];

    if(!segmentConfig)
      return this.endRequest(req, res, 422);

    for(var statName in segment){
      var statConfig = segmentConfig[statName];
      var statValue = segment[statName];
      statValue = new Parameter(statValue, statConfig).value();

      if(statValue !== undefined){
        var config = { };
        var store = statConfig.dataStore ||
                    segmentConfig.dataStore ||
                    console.log;


        for(var key in segmentConfig){
          config[key] = segmentConfig[key];
        }

        for(key in statConfig){
          config[key] = segmentConfig[key];
        }

        store(statName, statValue, config, req);
      }
    }
  }

  this.endRequest(req, res);
}

Metron.dataAdapters = {
  statsd: require('./data/statsd'),
  log: require('./data/log')
}

module.exports = Metron;
