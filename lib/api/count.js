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
  this.db.yokozuna.find(
    camelCaseToSnakeCase(modelName),
    conditionsToQueryString(this, modelName, where),
    function(error, data){
      var statusCode = error && error.statusCode;

      if (error)              return apiCallback(error);
      if (statusCode === 404) return apiCallback("Not found", null);
      if (statusCode)         return apiCallback(error.message);

      apiCallback(null, data.numFound);
    }
  );
};
