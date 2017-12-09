'use strict';

var async = require('neo-async');
var searchAndMapResults = require('./search_and_map_results');
var bucketNameComposer  = require('../private/bucket_name_composer');
var conditionsToIds     = require('../private/conditions_to_ids');

/**
 * Delete all instances for the given model
 * @param {String} modelName The model name
 * @param {Object} [where] The filter for where
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, where, apiCallback){
  var self = this;

  if (!apiCallback && 'function' === typeof where) {
    apiCallback = where;
    where = undefined;
  }

  var conditions = { where: where };
  var bucketName = bucketNameComposer(this, modelName);
  var ids;

  async.waterfall([
    searchOrDestroy
  ], apiCallback);

  function searchOrDestroy(callback){
    // Loopback has this strange behavior of always querying using
    // 'all' even when searching for just one document. Since we have
    // to use the search unnecessarily if the id is provided, we're
    // going to just use the 'destroy' method if we've determined that
    // we're simply looking up a document by id
    if (isQueryingJustById()){
      destroyMany(callback);
    } else {
      search(callback);
    }
  }

  function search(callback){
    self.searchAndMapResults(bucketName, conditions, self.destroy, callback);
  }

  // map the ids to parallel destroy-by-id queries
  function destroyMany(callback){
    async.map(ids, destroyOne, callback);
  }

  function destroyOne(id, callback){
    self.destroy(modelName, id, callback);
  }

  function isQueryingJustById(){
    ids = conditionsToIds(conditions);

    return !!ids && ids.length > 0;
  }
};
