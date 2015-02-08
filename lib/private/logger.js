'use strict';

var util = require('util');

module.exports = function(/* ... things to log ... */){
  var args = Array.prototype.slice.call(arguments);

  if (args.length === 0) return "";

  var message = args.map(function(arg){
    return [ "string", "number" ].indexOf(typeof(arg)) !== -1 ? arg : util.inspect(arg);
  }).join(" ");

  if (this.debug) console.log("Riak connector", message);

  return message;
};
