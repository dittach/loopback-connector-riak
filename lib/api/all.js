'use strict';

var async               = require('async');
var searchAndMapResults = require('../private/search_and_map_results');
var bucketNameComposer  = require('../private/bucket_name_composer');
var conditionsToIds     = require('../private/conditions_to_ids');

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

  // what's up with "ACL" being sent in here?
  if (modelName === "ACL") return apiCallback(null);

  // Loopback has this strange behavior of always querying using 'all'
  // even when searching for just one document. Since we have to use
  // the search unnecessarily if the id is provided, we're going to
  // just use the 'find' method if we've determined that we're simply
  // looking up a document by id
  if (isQueryingJustById()){
    findMany();
  } else {
    search();
  }

  function search(){
    searchAndMapResults(self, bucketNameComposer(self, modelName), conditions, self.find.bind(self), apiCallback);
  }

  // map the ids to parallel find-by-id queries
  function findMany(){
    async.map(ids, findOne, apiCallback);
  }

  function findOne(id, callback){
    self.find(modelName, id, callback);
  }

  function isQueryingJustById(){
    ids = conditionsToIds(conditions);
    return ids && ids.length !== 0;
  }
};
