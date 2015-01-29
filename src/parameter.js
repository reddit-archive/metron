'use strict';

var conversion = {

  integer: function(val) {
    val = parseInt(val);

    if (isNaN(val)) {
      return;
    }

    return val;
  },

  float: function(val) {
    val = parseFloat(val);

    if (isNaN(val)) {
      return;
    }

    return val;
  },

  string: function(val) {
    return (val == null ? '' : val).toString();
  },

  date: function(val) {
    var date = new Date(val);

    if (isNaN(date.getTime())) {
      date = new Date(parseInt(val));
    }

    if (isNaN(date.getTime())) {
      return;
    }

    return date;
  },

};

function Parameter(name, val, config, req) {
  if (val === undefined || name === undefined) {
    return undefined;
  }

  this.name = name;
  this.val = val;
  this.config = config || {};

  this.convert();
  this.validate();
  this.format(req);
}

Parameter.prototype.convert = function() {
  if (this.config.type) {
    try {
      this.val = conversion[this.config.type](this.val);
    } catch (e) {
      this.val = undefined;
    }
  }
};

Parameter.prototype.validate = function() {
  var val = this.val;
  var config = this.config;

  if ((config.max !== undefined && val > config.max) ||
      (config.min !== undefined && val < config.min) ||
      (config.length !== undefined && val.length > config.length)) {

    this.val = undefined;
    return;
  }

  if (config.validate) {
    this.val = config.validate(val);
  }
};

Parameter.prototype.format = function(req) {
  var config = this.config;

  if (config.type === 'string' && config.truncate) {
    this.val = this.val.substring(0, config.truncate);
  }

  if (config.format) {
    this.val = config.format(this.val, config);
  }

  if (this.config.formatName) {
    this.name = this.config.formatName(this.name, this.val, this.config, req);
  }

  if (this.config.formatValue) {
    this.val = this.config.formatValue(this.val);
  }
};

module.exports = Parameter;
