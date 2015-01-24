'use strict';

var searchAndMapResults = require('../private/search_and_map_results');
var bucketNameComposer  = require('../private/bucket_name_composer');

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

  // what's up with "ACL" being sent in here?
  if (modelName === "ACL") return apiCallback(null);

  // Loopback has this strange behavior of always querying using 'all'
  // even when searching for just one document. Since we have to use
  // the search unnecessarily if the id is provided, we're going to
  // just use the 'find' method if we've determined that we're simply
  // looking up a document by id
  if (isQueryingJustById()) return find();

  search();

  function isQueryingJustById(){
    var where = conditions && conditions.where;
    var id    = where && conditions.where.id;

    return id && where && Object.keys(where).length === 1;
  }

  function search(){
    searchAndMapResults(self, bucketNameComposer(self, modelName), conditions, self.find.bind(self), apiCallback);
  }

  function find(){
    self.find(modelName, conditions.where.id, function(error, result){
      // one result but send it back as an array because that's what's
      // expected
      apiCallback(error, [ result ]);
    });
  }
};
