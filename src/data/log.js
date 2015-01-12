'use strict';

var crypto = require('crypto');
var utils = require('../utils');

var defaultLogConfig = {
  format: function(segment, req) {
    var log = segment.reduce(function(initial, stat) {
      return initial  + stat.val + '\t';
    }, '');

    return log.trim();
  },
  save: function(str) {
    console.log(str);
  },
};

function Log(config) {
  this.config = utils.merge({}, defaultLogConfig, config);
  this.send = this.send.bind(this);
}

Log.prototype.format = function(segment, config, req) {
  config.log = config.log || {};

  var format = config.log.format || this.config.format;
  return format(segment, req);
};

Log.prototype.save = function(logString, config) {
  config.log = config.log || {};

  var save = config.log.save || this.config.save;
  return save(logString, config);
};

Log.prototype.send = function(segment, config, req) {
  config.log = config.log || {};

  if (config.log.sampleRate !== undefined &&
      Math.random() >= config.log.sampleRate) {
    return;
  }

  var logString = this.format(segment, config, req);
  this.save(logString, config);
};

module.exports = Log;
