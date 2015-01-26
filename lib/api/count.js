'use strict';

var conditionsToQueryString = require('../private/conditions_to_query_string');
var camelCaseToSnakeCase    = require('../private/camel_case_to_snake_case');
var bucketNameComposer      = require('../private/bucket_name_composer');

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

  this.db.yokozuna.find(
    camelCaseToSnakeCase(this, bucketName),
    conditionsToQueryString(this, modelName, where),
    function(error, data){
      var statusCode = error && error.statusCode;

      if (error)              return apiCallback(error);
      if (statusCode === 404) return apiCallback(null, null);
      if (statusCode)         return apiCallback(error.message);

      apiCallback(null, data.numFound);
    }
  );
};
