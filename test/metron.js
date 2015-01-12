'use strict';

var Metron = require('../src/metron');
var sinon = require('sinon');
var chai = require('chai');
var expect = require('chai').expect;
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
require('sinon-mocha').enhance(sinon);

var http = require('http');
var qs = require('querystring');

describe('Metron', function() {
  var config = {
    port: 80,
  };

  it('initializes with config', function() {
    var metron = new Metron(config);
    expect(metron.get('port')).to.equal(80);
  });

  it('can get config values', function() {
    var metron = new Metron(config);
    expect(metron.get('port')).to.equal(metron.config.port);
  });

  it('can set config values', function() {
    var metron = new Metron(config);

    metron.set({ port: 8080 });
    expect(metron.get('port')).to.equal(8080);
  });
});

describe('Metron server', function() {
  var config = {
    port: 8080,
    debug: true,
  };

  var metron;

  beforeEach(function() {
    metron = new Metron(config);
    metron.start();
  });

  afterEach(function() {
    metron.stop();
  });

  it('starts a server', function(done) {
    http.get('http://127.0.0.1:' + config.port, function(res) {
      expect(res.statusCode).to.equal(400);
      done();
    });
  });

  it('sends request data by querystring', function(done) {
    var data = JSON.stringify({ rum: { totalLoadTime: 1000 }  });
    var params = '?data=' + qs.escape(data);

    http.get('http://127.0.0.1:' + config.port + params, function(res) {
      expect(res.statusCode).to.equal(422);
      done();
    });
  });

  it('logs data specified in the Metron config', function(done) {
    var metronConfig = {
      segments: {
        rum: {
          stats: {
            totalLoadTime: {
              type: 'integer',
              dataStore: [sinon.spy()],
            },
          },
        },
      },
    };

    metron.set(metronConfig);

    var data = JSON.stringify({ rum: { totalLoadTime: 1000 }  });
    var params = '?data=' + qs.escape(data);

    http.get('http://127.0.0.1:' + config.port + params, function(res) {
      expect(res.statusCode).to.equal(204);

      expect(metronConfig.segments.rum.stats.totalLoadTime.dataStore[0])
        .calledWith('totalLoadTime', 1000);

      done();
    });
  });

  /* jshint maxlen: false */
  it('logs data specified in the Metron config to multiple stores', function(done) {
    var metronConfig = {
      segments: {
        rum: {
          stats: {
            totalLoadTime: {
              type: 'integer',
              dataStore: [sinon.spy(), sinon.spy()],
            },
          },
        },
      },
    };

    metron.set(metronConfig);

    var data = JSON.stringify({ rum: { totalLoadTime: 1000 }  });
    var params = '?data=' + qs.escape(data);

    http.get('http://127.0.0.1:' + config.port + params, function(res) {
      expect(res.statusCode).to.equal(204);

      expect(metronConfig.segments.rum.stats.totalLoadTime.dataStore[0])
        .calledWith('totalLoadTime', 1000);

      expect(metronConfig.segments.rum.stats.totalLoadTime.dataStore[1])
        .calledWith('totalLoadTime', 1000);

      done();
    });
  });

});
