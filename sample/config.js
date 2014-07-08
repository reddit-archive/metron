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

module.exports = config;
