'use strict';

var async  = require('async');
var search = require('./search');

module.exports = function(riak, modelName, where, mapIterator, apiCallback){
  async.waterfall([
    findKeys,
    mapResults,
    parallelize
  ], apiCallback);

  function findKeys(callback){
    search(riak, modelName, where, function(error, results){
      if (error)    return callback(error);
      if (!results) return apiCallback(null, null);

      callback(null, Object.keys(results));
    });
  }

  function mapResults(searchResultKeys, callback){
    callback(null, searchResultKeys.map(function(key){
      return function(mapCallback){
        mapIterator(modelName, key, mapCallback);
      }
    }));
  }

  function parallelize(removeQueries, callback){
    async.parallel(removeQueries, callback);
  }
}
