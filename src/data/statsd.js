/* jshint strict:false */

var dgram = require('dgram'),
    dns = require('dns');

var defaultStatsdConfig = {
  host: 'localhost',
  port: 8125,
  socketTimeout: 500,
  prefix: '',
  preCacheDNS: true,
  bufferTimeout: 500
};

function Statsd(config){
  this.config = config || {};

  for(var key in defaultStatsdConfig){
    this.config[key] =
      [config[key], defaultStatsdConfig[key]].filter(function(v){
        return v !== undefined
      })[0];
  }


  if(this.config.preCacheDNS){
    dns.lookup(config.host, (function(err, addr){
      if(!err){
        this.config.host = addr;
      }
    }).bind(this));
  }

  this.lastFlush = new Date();
  this.buffer = [];
  this.socket = this.config.socket || dgram.createSocket('udp4');
}

Statsd.prototype.stop = function(){
  this.socket.close();
}

Statsd.prototype.send = function(name, value, config, req){
  config.statsd = config.statsd || {};

  if(!this[config.statsd.eventType])
    return;

  if(config.statsd.sampleRate !== undefined &&
      Math.random() >= config.statsd.sampleRate)
    return;

  if(this.config.formatName)
    name = this.config.formatName(name, value, config, req);

  if(name === undefined)
    return;

  if(this.config.formatValue)
    value = this.config.formatName(name, value, config, req);

  if(value === undefined)
    return;

  if(this.config.prefix)
    name = this.config.prefix + '.' + name;

  var message = this[config.statsd.eventType](name, value);

  if(config.statsd.sampleRate)
    message += '|@' + config.statsd.sampleRate

  if(config.statsd.tags)
    message += '|#' + config.statsd.tags.join(',')

  this.buffer.push(message);

  this.flushBuffer();
}

Statsd.prototype.flushBuffer = function(){
  if(!this.config.bufferTimeout){
    this.buffer.forEach((function(b){
      var buffer = new Buffer(b);
      this.socket.send(buffer, 0, buffer.length, this.config.port,
        this.config.host, function(){});
    }).bind(this));

    this.buffer = [];
  }

  var now = new Date();

  // If it's been a second, go ahead and flush and clear the timeout.
  if(now - this.lastFlush > this.config.bufferTimeout){
    clearTimeout(this.bufferTimeout);
    this.bufferTimeout = null;
      var buffer = new Buffer(this.buffer.join('\n'));
      this.socket.send(buffer, 0, buffer.length, this.config.port,
        this.config.host, function(){});
  } else {
    // If it hasn't been a second, and there's no delayed call, create one
    // so everything gets flushed after a second.
    if(!this.bufferTimeout){
      this.bufferTimeout = setTimeout(this.flushBuffer.bind(this),
          this.config.bufferTimeout);
    }
  }
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
