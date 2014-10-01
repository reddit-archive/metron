/* jshint strict:false */

var http = require('http');
var url = require('url');
var qs = require('querystring');
var utils = require('./utils');
var Parameter = require('./parameter');

var defaultConfig = {
  port: 8000,
};

function Metron(config) {
  this.config = utils.merge(defaultConfig, config);
  this.segments = [];
  this.middleware = [];
}

Metron.prototype.registerSegment = function(name, config) {
  this.segments[name] = config;
};

Metron.prototype.registerMiddleware = function(fn, predicate) {
  this.middleware.push({
    fn: fn,
    predicate: predicate,
  });
};

Metron.prototype.start = function() {
  var server  = http.createServer(this.processRequest.bind(this));
  this.server = server;

  server.listen(this.config.port);
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
  statusCode = statusCode || 204;

  if (error) {
    error = error.message ? error.message : error
    statusCode = 500;
  }

  if (error && this.config.debug) {
    console.log('ERROR:');
    console.log(req.params);
    console.log(error);
  }

  req.ended = true;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,Accept,Origin,User-Agent,DNT,Cache-Control,X-Mx-ReqToken,Keep-Alive,X-Requested-With,If-Modified-Since');

  res.writeHead(statusCode);

  if (error) {
    res.write(error.toString());
  }

  res.end();
};

Metron.prototype.processParameters = function(req, res) {
  var params = req.params;

  this.middleware.forEach((function(m) {
    if(m.predicate && !m.predicate(req)) {
      return;
    }

    m.fn(req, res, this);
  }).bind(this));

  // return early if one of the middlewares ended the request.
  if (req.ended) {
    return;
  }

  for (var segmentName in params) {
    var segmentConfig = this.segments[segmentName];
    var segment = params[segmentName];
    var formattedSegment = [];

    if (!segmentConfig) {
      continue;
    }

    for (var statName in segmentConfig.stats) {
      var statConfig = segmentConfig.stats[statName];
      statConfig = utils.merge(segmentConfig, statConfig);

      var statValue = segment[statName];

      if (!statConfig) {
        continue;
      }

      stat = new Parameter(statName, statValue, statConfig, req);

      if (stat.val !== undefined) {
        formattedSegment.push(stat);
      }
    }

    if(formattedSegment) {
      var store = segmentConfig.dataStore ||
                  [console.log];

      store.forEach(function(s) {
        s(formattedSegment, segmentConfig, req);
      });
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
