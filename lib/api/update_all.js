'use strict';

var async               = require('async');
var searchAndMapResults = require('./search_and_map_results');
var bucketNameComposer  = require('../private/bucket_name_composer');
var conditionsToIds     = require('../private/conditions_to_ids');

/**
 * Update all matching instances
 * @param {String} model The model name
 * @param {Object} where The search criteria
 * @param {Object} data The property/value pairs to be updated
 * @callback {Function} apiCallback Callback function
 */
module.exports = function(modelName, where, data, apiCallback){
  var self       = this;
  var conditions = { where: where };
  var bucketName = bucketNameComposer(this, modelName);
  var ids;

  async.waterfall([
    bucketExists,
    searchOrUpdate
  ], apiCallback);

  function bucketExists(callback){
    self.db.buckets({}, function(error, buckets){
      if (error)                              return callback(error);
      if (buckets.indexOf(bucketName) === -1) return callback(null, false);

      callback(null, true);
    });
  }

  function searchOrUpdate(bucketExists, callback){
    if (!bucketExists) return callback(null, []);

    // Loopback has this strange behavior of always querying using
    // 'all' even when searching for just one document. Since we have
    // to use the search unnecessarily if the id is provided, we're
    // going to just use the 'destroy' method if we've determined that
    // we're simply looking up a document by id
    if (isQueryingJustById()){
      updateMany(callback);
    } else {
      search(callback);
    }
  }

  function search(callback){
    self.searchAndMapResults(bucketName, conditions, function(modelName, id, mapCallback){
      self.updateAttributes(modelName, id, data, mapCallback);
    }, callback);
  }

  // map the ids to parallel update-by-id queries
  function updateMany(callback){
    async.map(ids, updateOne, callback);
  }

  function updateOne(id, callback){
    self.updateAttributes(modelName, id, data, callback);
  }

  function isQueryingJustById(){
    ids = conditionsToIds(conditions);
    return ids && ids.length !== 0;
  }
};
