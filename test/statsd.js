'use strict';

var Statsd = require('../src/data/statsd');
var sinon = require('sinon');
var chai = require('chai');
var expect = require('chai').expect;
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
require('sinon-mocha').enhance(sinon);

var SocketStub = function(config) {
  for (var key in config) {
    this[key] = config[key];
  }

  this.close = sinon.spy();
  this.send = sinon.spy();
};

describe('Statsd adapter', function() {
  var statsd;
  var spy;
  var eventConfig;

  beforeEach(function() {
    statsd = new Statsd({
      prefix: 'pre',
      socket: new SocketStub(),
      preCacheDNS: false,
      bufferTimeout: 0,
    });

    eventConfig = {
      statsd: {
        eventType: 'increment',
      },
    };

    spy = statsd.socket.send;
  });

  it('sends to the right place', function() {
    var cb = sinon.spy();

    statsd.send('test', 1, eventConfig, cb);
    var expectedMessage = 'pre.test:1|c';

    var buffer = spy.args[0][0];
    var start = spy.args[0][1];
    var length = spy.args[0][2];
    var port = spy.args[0][3];
    var host = spy.args[0][4];

    expect(buffer.toString()).to.equal(expectedMessage);
    expect(start).to.equal(0);
    expect(length).to.equal(expectedMessage.length);
    expect(port).to.equal(8125);
    expect(host).to.equal('localhost');
  });

  it('increments', function() {
    statsd.send('test', 1, eventConfig);
    var expectedMessage = 'pre.test:1|c';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('decrements', function() {
    eventConfig.statsd.eventType = 'decrement';

    statsd.send('test', 1, eventConfig);
    var expectedMessage = 'pre.test:-1|c';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('counts', function() {
    eventConfig.statsd.eventType = 'counter';
    statsd.send('test', 3, eventConfig);
    var expectedMessage = 'pre.test:3|c';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('gauges', function() {
    eventConfig.statsd.eventType = 'gauge';
    statsd.send('test', 1, eventConfig);
    var expectedMessage = 'pre.test:1|g';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('times', function() {
    eventConfig.statsd.eventType = 'timing';
    statsd.send('test', 500, eventConfig);
    var expectedMessage = 'pre.test:500|ms';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('sets', function() {
    eventConfig.statsd.eventType = 'set';
    statsd.send('test', 50, eventConfig);
    var expectedMessage = 'pre.test:50|s';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('applies sampling', function() {
    eventConfig.statsd.sampleRate = 1.00;
    statsd.send('test', 1, eventConfig);
    var expectedMessage = 'pre.test:1|c|@1';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('applies tags', function() {
    eventConfig.statsd.tags = ['a', 'b'];
    statsd.send('test', 1, eventConfig);
    var expectedMessage = 'pre.test:1|c|#a,b';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('works with buffering', function(done) {
    statsd = new Statsd({
      prefix: 'pre',
      socket: new SocketStub(),
      preCacheDNS: false,
      bufferTimeout: 100,
    });

    spy = statsd.socket.send;

    statsd.send('test', 1, eventConfig);
    statsd.send('test2', 1, eventConfig);
    var expectedMessage = 'pre.test:1|c\npre.test2:1|c';
    expect(spy).not.called;

    setTimeout(function() {
      expect(spy).calledOnce;
      var buffer = spy.args[0][0];
      expect(buffer.toString()).to.equal(expectedMessage);
      done();
    }, 150);
  });
});
