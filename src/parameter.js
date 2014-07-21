/* jshint strict:false */

var conversion = {
  'integer': function(val) {
     val = parseInt(val);

     if (isNaN(val)) {
        return;
     }

     return val;
  },
  'float': function(val) {
     val = parseFloat(val);

     if (isNaN(val)) {
        return;
     }

     return val;
  },
  'string': function(val) {
    return val.toString();
  },
  'date': function(val) {
    var date = new Date(val);

    if (isNaN(date.getTime())) {
      date = new Date(parseInt(val));
    }

    if (isNaN(date.getTime())) {
      return;
    }

    return date;
  }
}

function Parameter(val, config) {
  this.config = config || {};

  this.val = val;

  if (this.config.type) {
    try {
      this.val = conversion[this.config.type](val);
    } catch(e) {
      this.val = undefined;
      return;
    }
  }

  this.val = this.validate();
  this.val = this.format();
}

Parameter.prototype.value = function() {
  return this.val;
};

Parameter.prototype.validate = function() {
  var val = this.val;
  var config = this.config;

  if (config.max !== undefined && val > config.max) {
    return;
  }

  if (config.min !== undefined && val < config.min) {
    return;
  }

  if (config.length !== undefined && val.length > config.length) {
    return;
  }

  if (!config.validate) {
    return val;
  }

  return config.validate(val);
}

Parameter.prototype.format = function() {
  var val = this.val;
  var config = this.config;

  if (config.truncate) {
    val = val.substring(0, config.truncate)
  }

  if (config.format) {
    return config.format(val, config);
  }

  return val;
}

module.exports = Parameter;

