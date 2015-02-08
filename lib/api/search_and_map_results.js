'use strict';

var async              = require('async');
var search             = require('../private/search');
var bucketNameComposer = require('../private/bucket_name_composer');

module.exports = function(bucketName, conditions, mapIterator, apiCallback){
  var self = this;
  var modelName = bucketNameComposer.decompose(this, bucketName);

  async.waterfall([
    findIds,
    mapResults,
    parallelize
  ], apiCallback);

  function findIds(callback){
    search(self, bucketName, conditions, function(error, results){
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
        mapIterator.call(self, modelName, id, mapCallback);
      }
    }));
  }

  function parallelize(mapQueries, callback){
    async.parallel(mapQueries, callback);
  }
}
