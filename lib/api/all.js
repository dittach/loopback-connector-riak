'use strict';

var _                   = require('lodash');
var async = require('neo-async');
var searchAndMapResults = require('./search_and_map_results');
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

  if (!apiCallback && 'function' === typeof where) {
    apiCallback = where;
    where = undefined;
  }

  var bucketName = bucketNameComposer(this, modelName);

  async.waterfall([
    searchOrFind,
    orderResultsByIdForFindById,
    filterEmptyResults,
    include
  ], apiCallback);

  function searchOrFind(callback){
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

  // For findById queries loopback seems to expect us to return
  // results in the order in which the ids are passed in.
  //
  // example: User.findById([4, 2, 3, 1], { vip: true }))
  //
  // But, at the same time, it doesn't give us a great way to know
  // whether we're in here as a result of a findById query or some
  // other query. So, we have to try to infer that by looking for the
  // configuration of id conditions built by loopback
  function orderResultsByIdForFindById(results, callback){
    // a findById query can look something like:
    // {"where":{"and":[{"id":{"inq":["4","2","3","1"]}},{"vip":true}]}}
    var findByIdsWithSearch = conditions.where &&
        conditions.where.and &&
        conditions.where.and[0] &&
        conditions.where.and[0].id &&
        conditions.where.and[0].id.inq;

    // a findById query can also look something like:
    // {"where":{"id":{"inq":["4","2","3","1"]}}}
    var findByIdsWithoutSearch = conditions.where &&
        conditions.where.id &&
        conditions.where.id.inq;

    var findByIds = findByIdsWithSearch || findByIdsWithoutSearch;

    // if it doesn't seem to be findById we don't have to hold
    // loopback's hand
    if (!findByIds) return callback(null, results);

      var resultsById = _.keyBy(results, "id");
    callback(null, _.map(findByIds, function (i){ return resultsById[i]; }));
  }

  function filterEmptyResults(results, callback){
    callback(null, _.compact(results));
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
