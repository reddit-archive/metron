/* jshint strict:false */
/* global describe,it,beforeEach */

var Statsd = require('../src/data/statsd'),
    sinon = require('sinon'),
    chai = require('chai'),
    expect = require('chai').expect,
    sinonChai = require('sinon-chai');

chai.use(sinonChai);
require('sinon-mocha').enhance(sinon);

function socketStub(config){
  for(var key in config){
    this[key] = config[key];
  }

  this.close = sinon.spy();
  this.send = sinon.spy();
}

describe('Statsd adapter', function() {
  var statsd, spy;

  beforeEach(function(){
    statsd = new Statsd({
      prefix: 'pre',
      socket: new socketStub(),
      preCacheDNS: false
    });

    spy = statsd.socket.send;
  });

  it('sends to the right place', function(){
    var cb = sinon.spy();

    statsd.send('test', 1, { eventType: 'increment' }, cb);
    var expectedMessage = 'pre.test:1|c';

    var buffer = spy.args[0][0];
    var start = spy.args[0][1];
    var length = spy.args[0][2];
    var port = spy.args[0][3];
    var host = spy.args[0][4];
    var callback = spy.args[0][5];

    expect(buffer.toString()).to.equal(expectedMessage);
    expect(start).to.equal(0);
    expect(length).to.equal(expectedMessage.length);
    expect(port).to.equal(8125);
    expect(host).to.equal('localhost');
    expect(callback).to.equal(cb);
  });

  it('increments', function(){
    statsd.send('test', 1, { eventType: 'increment' });
    var expectedMessage = 'pre.test:1|c';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('decrements', function(){
    statsd.send('test', 1, { eventType: 'decrement' });
    var expectedMessage = 'pre.test:-1|c';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('counts', function(){
    statsd.send('test', 3, { eventType: 'counter' });
    var expectedMessage = 'pre.test:3|c';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('gauges', function(){
    statsd.send('test', 1, { eventType: 'gauge' });
    var expectedMessage = 'pre.test:1|g';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('times', function(){
    statsd.send('test', 500, { eventType: 'timing' });
    var expectedMessage = 'pre.test:500|ms';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });

  it('sets', function(){
    statsd.send('test', 50, { eventType: 'set' });
    var expectedMessage = 'pre.test:50|s';
    var buffer = spy.args[0][0];
    expect(buffer.toString()).to.equal(expectedMessage);
  });
})
