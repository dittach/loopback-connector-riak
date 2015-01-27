'use strict';

var out = function(riak, modelName){
  var out = [ modelName ];

  if (riak.settings.bucketPrefix) out.unshift(riak.settings.bucketPrefix);

  return out.join("");
}

out.decompose = function(riak, bucketName){
  if (!riak.settings.bucketPrefix) return bucketName;

  return bucketName.replace(riak.settings.bucketPrefix, "");
};

module.exports = out;
