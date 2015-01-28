'use strict';

var fs = require('fs');
var Log = require('./log');
var util = require('util');

function buildStream(stream, path) {
  if (stream) {
    stream.end();
  }

  return fs.createWriteStream(path, {
    flags: 'a',
    encoding: 'utf8',
  });
}

function LogStream() {
  Log.apply(this, arguments);

  this.buildStream();
}

util.inherits(LogStream, Log);

LogStream.prototype.save = function(str) {
  this.stream.write(str + '\n');
};

LogStream.prototype.buildStream = function() {
  this.stream = buildStream(this.stream, this.config.path);
};

module.exports = LogStream;
