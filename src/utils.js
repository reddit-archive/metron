'use strict';

var utils = {};

utils.merge = function() {
  var obj = {};
  var args = Array.prototype.slice.call(arguments);

  args.forEach(function(arg) {
    for (var key in arg) {
      if (arg.hasOwnProperty(key)) {
        obj[key] = arg[key];
      }
    }
  });

  return obj;
};

module.exports = utils;
