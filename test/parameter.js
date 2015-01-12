'use strict';

var Parameter = require('../src/parameter');
var sinon = require('sinon');
var chai = require('chai');
var expect = require('chai').expect;
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
require('sinon-mocha').enhance(sinon);

describe('Parameter', function() {
  var config;

  beforeEach(function() {
    config = {};
  });

  it('initializes with config', function() {
    var param = new Parameter('param', config);
    expect(param.value()).to.equal('param');
  });

  it('parses to integer', function() {
    config.type = 'integer';

    var param = new Parameter('0', config);
    expect(param.value()).to.equal(0);

    param = new Parameter('A', config);
    expect(param.value()).to.equal(undefined);
  });

  it('parses to float', function() {
    config.type = 'float';

    var param = new Parameter('1.01', config);
    expect(param.value()).to.equal(1.01);

    param = new Parameter('A', config);
    expect(param.value()).to.equal(undefined);
  });

  it('parses to string', function() {
    config.type = 'string';

    var param = new Parameter(0, config);
    expect(param.value()).to.equal('0');
  });

  it('parses to date', function() {
    var date = new Date('Jan 21, 2014').getTime();
    config.type = 'date';

    var param = new Parameter('Jan 21, 2014', config);
    expect(param.value().getTime()).to.equal(date);

    param = new Parameter('A', config);
    expect(param.value()).to.equal(undefined);
  });

  it('returns undefined for an unknown type', function() {
    config.type = 'wat';

    var param = new Parameter('A', config);
    expect(param.value()).to.equal(undefined);
  });

  it('checks validation', function() {
    config.validate = function(val) {
      if (val === 'A') {
        return val;
      }
    };

    var param = new Parameter('A', config);
    expect(param.value()).to.equal('A');

    param = new Parameter('B', config);
    expect(param.value()).to.equal(undefined);
  });

  it('formats results', function() {
    config.format = function(val) {
      return val.replace(/-/, '.');
    };

    var param = new Parameter('A-B', config);
    expect(param.value()).to.equal('A.B');
  });

  it('checks min', function() {
    config.min = 1;

    var param = new Parameter(1, config);
    expect(param.value()).to.equal(1);

    param = new Parameter(0, config);
    expect(param.value()).to.equal(undefined);
  });

  it('checks max', function() {
    config.max = 2;

    var param = new Parameter(1, config);
    expect(param.value()).to.equal(1);

    param = new Parameter(3, config);
    expect(param.value()).to.equal(undefined);
  });

  it('checks length', function() {
    config.length = 2;

    var param = new Parameter('AB', config);
    expect(param.value()).to.equal('AB');

    param = new Parameter('ABC', config);
    expect(param.value()).to.equal(undefined);
  });

  it('truncates', function() {
    config.truncate = 2;

    var param = new Parameter('AB', config);
    expect(param.value()).to.equal('AB');

    param = new Parameter('ABC', config);
    expect(param.value()).to.equal('AB');
  });
});
