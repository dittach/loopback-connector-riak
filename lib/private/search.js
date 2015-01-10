'use strict';

var conditionsToQueryString = require('./conditions_to_query_string');

// TODO: what happens when indexes are queried with conditions that
// aren't indexed. error? crash? ignored?
module.exports = function(riak, modelName, where, apiCallback){
  riak.db.yokozuna.find(
    modelName.toLowerCase(),
    conditionsToQueryString(riak, modelName, where),
    {},
    function(error, data){
      var statusCode = error && error.statusCode;

      if (statusCode === 404) return apiCallback(null, null);
      if (statusCode)         return apiCallback(error.message);

      apiCallback(data);
    }
  );
};
