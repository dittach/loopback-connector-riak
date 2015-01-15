'use strict';

var conditionsToQueryString = require('../private/conditions_to_query_string');
var camelCaseToSnakeCase = require('../private/camel_case_to_snake_case');

/**
 * Count the number of records for the given model
 *
 * @param {String} modelName The model name
 * @param {Function} [apiCallback] The callback function
 * @param {Object} filter The filter for where
 *
 */
module.exports = function(modelName, apiCallback, where){
  // FIXME: discussions with Riak indicate that running JS map reduce
  // is a bad idea. should just check the number of results returned
  // by the solr
  this.db.yokozuna.find(
    camelCaseToSnakeCase(modelName),
    conditionsToQueryString(this, modelName, where),
    function(error, data){
      var statusCode = error && error.statusCode;

      if (statusCode === 404) return apiCallback("Not found", null);
      if (statusCode)         return apiCallback(error.message);

      apiCallback(data);
    }
  );
};
