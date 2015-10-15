'use strict';

var conditionsToQueryString = require('../private/conditions_to_query_string');
var camelCaseToSnakeCase    = require('../private/camel_case_to_snake_case');
var bucketNameComposer      = require('../private/bucket_name_composer');

// used to find all the documents (probably not recommended)
var findAllWhere = { "id": { "neq": false } };

/**
 * Count the number of records for the given model
 *
 * @param {String} modelName The model name
 * @param {Function} [apiCallback] The callback function
 * @param {Object} filter The filter for where
 *
 */
module.exports = function(modelName, apiCallback, where){
  var bucketName = bucketNameComposer(this, modelName);

  // allow "all" to be counted if no meaningful 'where' is provided
  if (!where || Object.keys(where).length === 0) where = findAllWhere;

  this.db.search({
    indexName: camelCaseToSnakeCase(bucketName),
    q:         conditionsToQueryString(this, bucketName, where),
    maxRows:  0
  }, function(error, data){
    if (error) return apiCallback(error);

    apiCallback(null, data.numFound);
  });
};
