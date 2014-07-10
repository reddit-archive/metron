/* jshint strict:false */
/* global describe,it,beforeEach */

var Log = require('../src/data/log'),
    sinon = require('sinon'),
    chai = require('chai'),
    expect = require('chai').expect,
    sinonChai = require('sinon-chai');

chai.use(sinonChai);
require('sinon-mocha').enhance(sinon);

var crypto = require('crypto');
var shasum = crypto.createHash('sha1');

describe('Log adapter', function() {
  var log, spy, eventConfig;

  var req = {
    host: '127.0.0.1',
    'user-agent': 'curl/7.22.0',
    'accept': '*/*'
  };

  beforeEach(function(){
    log = new Log({
      log: sinon.spy()
    });

    eventConfig = {
      log: {
      }
    };
  });

  it('formats logs', function(){
    var shasum = crypto.createHash('sha1');
    shasum.update(req.host + req['user-agent']);
    var id = shasum.digest('hex');
    var expectation = id + ':\t' + 'test' + '\t' + 1;

    log.send('test', 1, eventConfig, req);

    expect(log.config.log).to.be.calledWith(expectation);
  });

  it('applies sampling', function(){
    eventConfig.log.sampleRate = 0
    log.send('test', 1, eventConfig, req);
    expect(log.config.log.args.length).to.equal(0);
  });

  it('uses a custom formatter', function(){
    var shasum = crypto.createHash('sha1');
    shasum.update(req.host + req['user-agent']);
    var id = shasum.digest('hex');

    eventConfig.log.format = sinon.spy()
    log.send('test', 1, eventConfig, req);

    expect(eventConfig.log.format).to.be.calledWith(
        'test', 1, eventConfig, id);
  });
})
