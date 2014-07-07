/* jshint strict:false */

var defaultConfig = {
  rules: [],
  port: 8000
};

function Funnel(config){
  this.config = {};
  this.set(config);
}

Funnel.prototype.get = function(key){
  return this.config[key];
}

Funnel.prototype.set = function(obj){
  for(var key in defaultConfig){
    this.config[key] = obj[key] || this.config[key] || defaultConfig[key];
  }

  return this.config;
}

Funnel.prototype.start = function(){
  // start http server
  // serve requests
}

module.exports = Funnel;
