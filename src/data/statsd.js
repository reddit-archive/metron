/* jshint strict:false */

var dgram = require('dgram'),
    dns = require('dns');

var defaultStatsdConfig = {
  host: 'localhost',
  port: 8125,
  socketTimeout: 1000,
  prefix: '',
  preCacheDNS: true
};

function Statsd(config){
  this.config = config || {};

  for(var key in defaultStatsdConfig){
    this.config[key] = config[key] || defaultStatsdConfig[key];
  }

  if(this.config.preCacheDNS){
    dns.lookup(config.host, (function(err, addr){
      if(!err){
        this.config.host = addr;
      }
    }).bind(this));
  }

  this.socket = this.config.socket || dgram.createSocket('udp4');
}

Statsd.prototype.stop = function(){
  this.socket.close();
}

Statsd.prototype.send = function(name, value, config, callback){
  config.statsd = config.statsd || {};

  if(!this[config.statsd.eventType])
    return;

  if(config.statsd.sampleRate && Math.random() >= config.statsd.sampleRate)
    return;

  if(this.config.prefix)
    name = this.config.prefix + '.' + name;

  var message = this[config.statsd.eventType](name, value);

  if(config.statsd.sampleRate)
    message += '|@' + config.statsd.sampleRate

  if(config.statsd.tags)
    message += '|#' + config.statsd.tags.join(',')

  var buffer = new Buffer(message);

  this.socket.send(buffer, 0, buffer.length, this.config.port, this.config.host,
      callback);
}

Statsd.prototype.counter = function(name, value){
  value = name + ':' + value + '|c';
  return value;
}

Statsd.prototype.increment = function(name, value){
  return this.counter(name, value || 1);
}

Statsd.prototype.decrement = function(name, value){
  return this.counter(name, -value || -1);
}

Statsd.prototype.gauge = function(name, value){
  value = name + ':' + value + '|g';
  return value;
}

Statsd.prototype.timing = function(name, value){
  value = name + ':' + value + '|ms';
  return value;
}

Statsd.prototype.set = function(name, value){
  value = name + ':' + value + '|s';
  return value;
}

module.exports = Statsd;
