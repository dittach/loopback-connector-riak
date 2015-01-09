'use strict';

module.exports = function(/* ... things to log ... */){
  var args = Array.prototype.slice.call(arguments);

  if (!this.debug)       return;
  if (args.length === 0) return;

  var message = args.map(function(arg){
    return [ "string", "number" ].indexOf(typeof(arg)) !== -1 ? arg : util.inspect(arg);
  }).join(" ");

  console.log("Riak connector", message);

  return message;
};
