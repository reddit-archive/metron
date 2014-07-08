/* jshint strict:false */
/* global describe,it,beforeEach,afterEach */

var Funnel = require('../src/funnel'),
    sinon = require('sinon'),
    chai = require('chai'),
    expect = require('chai').expect,
    sinonChai = require('sinon-chai');

chai.use(sinonChai);
require('sinon-mocha').enhance(sinon);

var http = require('http');
var qs = require('querystring');

describe('Funnel', function() {
  var config = {
    port: 80
  }

  it('initializes with config', function(){
    var funnel = new Funnel(config)
    expect(funnel.get('port')).to.equal(80);
  });

  it('can get config values', function(){
    var funnel = new Funnel(config)
    expect(funnel.get('port')).to.equal(funnel.config.port);
  });

  it('can set config values', function(){
    var funnel = new Funnel(config)

    funnel.set({ port: 8080 });
    expect(funnel.get('port')).to.equal(8080);
  });
});

describe('Funnel server', function(){
  var config = {
    port: 8080
  };

  var funnel;

  beforeEach(function(){
    funnel = new Funnel(config);
    funnel.start();
  });

  afterEach(function(){
    funnel.stop();
  });

  it('starts a server', function(done){
    http.get('http://127.0.0.1:' + config.port, function(res){
      expect(res.statusCode).to.equal(400);
      done();
    });
  });

  it('sends request data by querystring', function(done){
    var data = JSON.stringify({ rum: { totalLoadTime: 1000 }  });
    var params = '?data=' + qs.escape(data);

    http.get('http://127.0.0.1:' + config.port + params, function(res){
      expect(res.statusCode).to.equal(422);
      done();
    });
  });

  it('logs data specified in the Funnel config', function(done){
    var funnelConfig = {
      segments: {
        rum: {
         totalLoadTime: {
           type: 'integer',
           dataStore: sinon.spy()
         }
        }
      }
    };

    funnel.set(funnelConfig);

    var data = JSON.stringify({ rum: { totalLoadTime: 1000 }  });
    var params = '?data=' + qs.escape(data);

    http.get('http://127.0.0.1:' + config.port + params, function(res){
      expect(res.statusCode).to.equal(204);

      expect(funnelConfig.segments.rum.totalLoadTime.dataStore)
        .calledWith('totalLoadTime', 1000);

      done();
    });
  });
});

