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
  if(val === undefined){
    return val;
  }

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

  this.validate();
  this.format();
}

Parameter.prototype.value = function() {
  return this.val;
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
}

Parameter.prototype.format = function() {
  var config = this.config;

  if (!this.val) {
    return;
  }

  if (config.truncate) {
    this.val = this.val.substring(0, config.truncate)
  }

  if (config.format) {
    this.val = config.format(this.val, config);
  }
}

module.exports = Parameter;

