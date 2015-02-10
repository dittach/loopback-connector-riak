'use strict';

var conditionsToQueryString = require('../private/conditions_to_query_string');
var camelCaseToSnakeCase    = require('../private/camel_case_to_snake_case');

// TODO: support filters
//
// Loopback expects support for:
// * Fields filter
// * Include filter
// * Limit filter
// * Order filter
// * Skip filter
// * Where filter
//
// http://docs.strongloop.com/display/public/LB/Querying+data
module.exports = function(bucketName, conditions, apiCallback){
  var riak = this;
  var where = conditions.where || {};

  riak.db.yokozuna.find(
    camelCaseToSnakeCase(bucketName),
    conditionsToQueryString(riak, bucketName, where),
    {},
    function(error, solrResponse, riakResponse){
      if (error)                                               return apiCallback(error);
      if (didRiakErrorOut(riakResponse))                       return apiCallback("unexpected error");
      if (!didSolrReturnResultsEmptyOrOtherwise(solrResponse)) return apiCallback("unexpected error");

      apiCallback(null, indexDocResponses(solrResponse.docs));
    }
  );

  function didRiakErrorOut(response){
    // a missing riak response means that it couldn't connect to Solr
    if (!response) return true;

    // the riak web server returns "statusCode" a success will be a
    // 2xx. failure will be 5xx. not found is 4xx
    var statusCodeCategory = response.statusCode && response.statusCode.toString()[0];
    if (statusCodeCategory === "2") return false;

    return true;
  }

  function didSolrReturnResultsEmptyOrOtherwise(response){
    var statusCategory = response.status && response.status.toString()[0];

    if (statusCategory === 5){
      console.log("solr produced error", response.message, "querying", bucketName, "where", where);
    }

    if (response.docs && response.docs.constructor === Array) return true;

    return false;
  }

  function indexDocResponses(docs){
    var out = {};

    // I think a more convenient format is to return the doc responses
    // indexed by key. the internal _yz_rk key really is meaningless
    // for the most people. that way you can do Object.keys(docs) and
    // pull those keys right quick
    docs.forEach(function(docResponse){
      out[docResponse._yz_rk] = docResponse;
    });

    return out;
  }
};
