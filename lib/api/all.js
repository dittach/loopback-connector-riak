'use strict';

var searchAndMapResults = require('../private/search_and_map_results');

/**
 * Find matching model instances by the filter
 * WARNING: at the moment this just returns all the things ever
 *
 * @param {String} model The model name
 * @param {Object} filter The filter
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, conditions, apiCallback){
  // what's up with "ACL" being sent in here?
  if (modelName === "ACL") return apiCallback(null);

  searchAndMapResults(this, modelName, conditions.where, this.find.bind(this), apiCallback);
};
