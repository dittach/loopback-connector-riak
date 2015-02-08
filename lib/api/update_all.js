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
module.exports = function(model, where, data, apiCallback){
  var self       = this;
  var conditions = { where: where };
  var bucketName = bucketNameComposer(this, modelName);
  var ids;

  // Loopback has this strange behavior of always querying using 'all'
  // even when searching for just one document. Since we have to use
  // the search unnecessarily if the id is provided, we're going to
  // just use the 'destroy' method if we've determined that we're
  // simply destroying a document by id
  if (isQueryingJustById()){
    updateMany();
  } else {
    search();
  }

  function search(){
    self.searchAndMapResults(bucketName, conditions, function(modelName, id, mapCallback){
      self.updateAttributes(modelName, id, data, mapCallback);
    }, apiCallback);
  }

  function isQueryingJustById(){
    ids = conditionsToIds(conditions);
    return ids && ids.length !== 0;
  }

  // map the ids to parallel update-by-id queries
  function updateMany(){
    async.map(ids, updateOne, apiCallback);
  }

  function updateOne(id, callback){
    self.destroy(modelName, id, callback);
  }
};
