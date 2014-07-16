var Statsd = require('metron').dataAdapters.Statsd;
var statsd = new Statsd({
  host: process.env.statsd_host,
  port: process.env.statsd_port,
});

var intConfig = {
  type: 'number',
  min: 0,
  max: 100
};

var stringConfig = {
  type: 'string',
  length: 256
};

var config = {
  port: 8000,
  segments: {
    rum: {
      dataStore: statsd,
      stats: {
        dnsTiming: intConfig,
        tcpTiming: intConfig,
        requestTiming: intConfig,
        responseTiming: intConfig,
        domLoadingTiming: intConfig,
        domnumbereractiveTiming: intConfig,
        domContentLoadedTiming: intConfig,
        actionName: stringConfig,
        verification: stringConfig,
      }
    }
  }
}

module.exports = config;
