/* jshint strict:false */
/* global describe,it */

var Funnel = require('../src/funnel'),
    sinon = require('sinon'),
    chai = require('chai'),
    expect = require('chai').expect,
    sinonChai = require('sinon-chai');

chai.use(sinonChai);
require('sinon-mocha').enhance(sinon);

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

