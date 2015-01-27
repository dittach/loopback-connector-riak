'use strict';

var async              = require('async');
var search             = require('./search');
var bucketNameComposer = require('./bucket_name_composer');

module.exports = function(riak, bucketName, conditions, mapIterator, apiCallback){
  var modelName = bucketNameComposer.decompose(riak, bucketName);

  async.waterfall([
    findIds,
    mapResults,
    parallelize
  ], apiCallback);

  function findIds(callback){
    search(riak, bucketName, conditions, function(error, results){
      if (error)    return callback(error);
      if (!results) return apiCallback(null, null);

      callback(null, Object.keys(results));
    });
  }

  function mapResults(searchResultIds, callback){
    callback(null, searchResultIds.map(function(id){
      return function(mapCallback){
        // since map most likely maps to other 'first-level' api
        // methods, which take a modelName rather than a bucketName,
        // we should pass the modelName back here
        mapIterator(modelName, id, mapCallback);
      }
    }));
  }

  function parallelize(mapQueries, callback){
    async.parallel(mapQueries, callback);
  }
}
