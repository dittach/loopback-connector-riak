'use strict';

var async               = require('async');
var searchAndMapResults = require('../private/search_and_map_results');
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
  var conditions = { where: where };
  var ids;

  // Loopback has this strange behavior of always querying using 'all'
  // even when searching for just one document. Since we have to use
  // the search unnecessarily if the id is provided, we're going to
  // just use the 'destroy' method if we've determined that we're
  // simply destroying a document by id
  if (isQueryingJustById()){
    destroyMany();
  } else {
    search();
  }

  function search(){
    searchAndMapResults(self, bucketNameComposer(self, modelName), conditions, self.destroy.bind(self), apiCallback);
  }

  function isQueryingJustById(){
    ids = conditionsToIds(conditions);
    return ids && ids.length !== 0;
  }

  // map the ids to parallel destroy-by-id queries
  function destroyMany(){
    async.map(ids, destroyOne, apiCallback);
  }

  function destroyOne(id, callback){
    self.destroy(modelName, id, callback);
  }
};
