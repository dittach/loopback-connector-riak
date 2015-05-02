'use strict';

var async                 = require('async');
var searchAndMapResults   = require('./search_and_map_results');
var bucketNameComposer    = require('../private/bucket_name_composer');
var conditionsToIds       = require('../private/conditions_to_ids');
var filterEmptyCollection = require('../private/compact_collection');

/**
 * Find matching model instances by the filter
 * WARNING: at the moment this just returns all the things ever
 *
 * @param {String} model The model name
 * @param {Object} filter The filter
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, conditions, apiCallback){
  var self = this;
  var ids;

  if (!apiCallback && 'function' === typeof where) {
    apiCallback = where;
    where = undefined;
  }

  var bucketName = bucketNameComposer(this, modelName);

  async.waterfall([
    bucketExists,
    searchOrFind,
    filterEmptyCollection,
    include
  ], apiCallback);

  function bucketExists(callback){
    self.db.buckets({}, function(error, buckets){
      if (error)                              return callback(error);
      if (buckets.indexOf(bucketName) === -1) return callback(null, false);

      callback(null, true);
    });
  }

  function searchOrFind(bucketExists, callback){
    if (!bucketExists) return callback(null, []);

    // Loopback has this strange behavior of always querying using 'all'
    // even when searching for just one document. Since we have to use
    // the search unnecessarily if the id is provided, we're going to
    // just use the 'find' method if we've determined that we're simply
    // looking up a document by id
    if (isQueryingJustById()){
      findMany(callback);
    } else {
      search(callback);
    }
  }

  function search(callback){
    self.searchAndMapResults(bucketName, conditions, self.find, callback);
  }

  // map the ids to parallel find-by-id queries
  function findMany(callback){
    async.map(ids, findOne, callback);
  }

  function findOne(id, callback){
    self.find(modelName, id, callback);
  }

  function isQueryingJustById(){
    ids = conditionsToIds(conditions);

    return !!ids && ids.length > 0;
  }

  function include(results, callback){
    if (!conditions || !conditions.include) return callback(null, results);

    self._models[modelName].model.include(results, conditions.include, callback);
  }
};
