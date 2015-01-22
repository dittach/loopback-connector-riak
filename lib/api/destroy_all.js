'use strict';

var searchAndMapResults = require('../private/search_and_map_results');

/**
 * Delete all instances for the given model
 * @param {String} modelName The model name
 * @param {Object} [where] The filter for where
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, where, apiCallback){
  var self = this;

  // Loopback has this strange behavior of always querying using 'all'
  // even when searching for just one document. Since we have to use
  // the search unnecessarily if the id is provided, we're going to
  // just use the 'destroy' method if we've determined that we're
  // simply destroying a document by id
  if (isQueryingJustById()) return destroyOne();

  searchAndMapResults(this, modelName, where, this.destroy.bind(this), apiCallback);

  function isQueryingJustById(){
    var id = where && where.id;

    return id && where && Object.keys(where).length === 1;
  }

  function destroyOne(){
    self.destroy(modelName, where.id, function(error, result){
      if (error) return apiCallback(error);

      // one result but send it back as an array because that's what's
      // expected
      apiCallback(null, [ result ]);
    });
  }
};
