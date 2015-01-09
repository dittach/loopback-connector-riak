'use strict';

var conditionsToQueryString = require('../private/conditions_to_query_string');

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
    modelName,
    conditionsToQueryString(this, modelName, where),
    [
      {
        "map": {
          "language": "javascript",
          "keep": false,
          "source": "function(v) { return [1]; }"
        }
      },
      {
        "reduce": {
          "language": "javascript",
          "keep": true,
          "name": "Riak.reduceSum"
        }
      }
    ],
    // TODO: see what kind of a result we get back from the map reduce
    function(error, data){
      var statusCode = error && error.statusCode;

      if (statusCode === 404) return apiCallback("Not found", null);
      if (statusCode)         return apiCallback(error.message);

      apiCallback(data);
    }
  );
};
