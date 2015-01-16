'use strict';

var async  = require('async');
var search = require('./search');

module.exports = function(riak, modelName, where, mapIterator, apiCallback){
  async.waterfall([
    findIds,
    mapResults,
    parallelize
  ], apiCallback);

  function findIds(callback){
    search(riak, modelName, where, function(error, results){
      if (error)    return callback(error);
      if (!results) return apiCallback(null, null);

      callback(null, Object.keys(results));
    });
  }

  function mapResults(searchResultIds, callback){
    callback(null, searchResultIds.map(function(id){
      return function(mapCallback){
        mapIterator(modelName, id, mapCallback);
      }
    }));
  }

  function parallelize(removeQueries, callback){
    async.parallel(removeQueries, callback);
  }
}
