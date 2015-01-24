'use strict';

module.exports = function(riak, modelName){
  var out = [ modelName ];

  if (riak.settings.bucketPrefix) out.unshift(riak.settings.bucketPrefix);

  return out.join("");
}
