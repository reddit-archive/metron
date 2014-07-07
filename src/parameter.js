/* jshint strict:false */

var defaultConfig = {

};

var conversion = {
  'integer': function(val){
     val = parseInt(val);

     if(isNaN(val))
        return undefined;

     return val;
  },
  'float': function(val){
     val = parseFloat(val);

     if(isNaN(val))
        return undefined;

     return val;
  },
  'string': function(val){
    return val.toString();
  },
  'date': function(val){
    var date = new Date(val);

    if(isNaN(date.getTime()))
      date = new Date(parseInt(val));

    if(isNaN(date.getTime()))
      return undefined;

    return date;
  }
}

function Parameter(val, config){
  this.config = config || {};

  for(var key in defaultConfig){
    this.config[key] = config[key] || defaultConfig[key]
  }

  this.val = val;

  if(this.config.type){
    try {
      this.val = conversion[this.config.type](val);
    } catch(e){
      this.val = undefined;
      return;
    }
  }

  this.val = this.validate();
  this.val = this.format();
}

Parameter.prototype.value = function(){
  return this.val;
};

Parameter.prototype.validate = function(){
  var val = this.val;
  var config = this.config;

  if(config.max !== undefined && val > config.max)
    return undefined;

  if(config.min !== undefined && val < config.min)
    return undefined;

  if(config.length !== undefined && val.length > config.length)
    return undefined;

  if(!config.validate)
    return val;

  return config.validate(val);
}

Parameter.prototype.format = function(){
  var val = this.val;
  var config = this.config;

  if(config.truncate)
    val = val.substring(0, config.truncate)

  if(config.format)
    return config.format(val);

  return val;
}

module.exports = Parameter;

