/* jshint strict:false */

var http = require('http');
var url = require('url');
var qs = require('querystring');
var utils = require('./utils');
var Parameter = require('./parameter');

var defaultConfig = {
  segments: [],
  port: 8000
};

function Metron(config) {
  this.config = utils.merge(defaultConfig, config);
}

Metron.prototype.get = function(key) {
  return this.config[key];
}

Metron.prototype.set = function(obj) {
  this.config = utils.merge(this.config, obj);
  return this.config;
}

Metron.prototype.start = function() {
  var server  = http.createServer(this.processRequest.bind(this));
  this.server = server;

  server.listen(this.get('port'));
}

Metron.prototype.stop = function() {
  this.server.close();
}

Metron.prototype.processRequest = function(req, res) {
  var params = {};
  var parsedUrl = url.parse(req.url, true);

  if (req.method === 'GET') {
    if (!parsedUrl.query || !parsedUrl.query.data) {
      return this.endRequest(req, res, 400, 'No data passed in.');
    }

    try {
      req.params = JSON.parse(parsedUrl.query.data);
      this.processParameters(req, res);
    } catch(e) {
      return this.endRequest(req, res, 400, e);
    }
  } else {
    var body = [];

    req.on('data', function (data) {
      body.push(data.toString());
    });

    req.on('end', (function () {
      body = body.join('');

      var isJSON = req.headers['content-type'] && 
          req.headers['content-type'].toLowerCase().indexOf('json') > -1;

      if (isJSON) {
        try {
          req.params = JSON.parse(body);
        } catch(e) {
          return this.endRequest(req, res, 400, e);
        }
      } else {
        req.params = qs.parse(body);
      }

      this.processParameters(req, res);
    }).bind(this));
  }
}

Metron.prototype.endRequest = function(req, res, statusCode, error) {
  if (error && this.config.debug) {
    console.log('ERROR:');
    console.log(req.params);
    console.log(error);
  }

  if (!statusCode) {
    if (error) {
      statusCode = 500;
    } else {
      statusCode = 204;
    }
  }

  req.ended = true;
  res.writeHead(statusCode);
  res.write(error);
  res.end();
};

Metron.prototype.processParameters = function(req, res) {
  var params = req.params;

  if (this.config.middleware) {
    for (var i = 0; i < this.config.middleware.length; i++) {
      this.config.middleware[i](req, res, this);
      // return early if one of the middlewares ended the request.
      if (req.ended) {
        return;
      }
    }
  }

  for (var segmentName in params) {
    var segmentConfig = this.config.segments[segmentName];
    var segment = params[segmentName];

    if (!segmentConfig) {
      var error = segmentName + ' not defined.';
      return this.endRequest(req, res, 422, error);
    }

    for (var statName in segment) {
      var statConfig = segmentConfig.stats[statName];
      var statValue = segment[statName];

      statValue = new Parameter(statValue, statConfig).value();

      if (statValue !== undefined) {
        var config = utils.merge(segmentConfig, statConfig);

        var store = statConfig.dataStore ||
                    segmentConfig.dataStore ||
                    console.log;

        if (typeof store === 'function') {
          store(statName, statValue, config, req);
        } else if (typeof store === 'object') {
          store.forEach(function(s) {
            s(statName, statValue, config, req);
          });
        }
      }
    }
  }

  this.endRequest(req, res);
}

Metron.dataAdapters = {
  Statsd: require('./data/statsd'),
  Log: require('./data/log')
}

Metron.utils = utils;

module.exports = Metron;
