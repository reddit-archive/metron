/* jshint strict:false */
var crypto = require('crypto');
var utils = require('../utils');

var defaultLogConfig = {
  log: console.log
};

function Log(config) {
  this.config = utils.merge({}, defaultLogConfig, config);
  this.send = this.send.bind(this);
}

Log.prototype.format = function(name, value, config, id) {
  var format = config.log.format || this.config.format;

  if (format) {
    return format(name, value, config, id);
  }

  return id + ':\t' + name + '\t' + value;
}

Log.prototype.send = function(name, value, config, req) {
  if (config.log.sampleRate !== undefined && 
      Math.random() >= config.log.sampleRate) {
    return;
  }

  if (config.log.formatName) {
    name = config.log.formatName(name, value, config, req);
  }

  if (name === undefined) {
    return;
  }

  if (config.log.formatValue) {
    value = config.log.formatValue(name, value, config, req);
  }

  if (value === undefined) {
    return;
  }

  // Generate an id that more or less identifies a user.
  var userAgent = req.headers['user-agent'] || Math.random().toString();
  var host = req.headers.host || Math.random().toString();
  var id;

  var shasum = crypto.createHash('sha1');
  shasum.update(host + userAgent);
  id = shasum.digest('hex');

  return this.config.log(this.format(name, value, config, id));
}

module.exports = Log;

