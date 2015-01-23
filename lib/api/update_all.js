'use strict';

var searchAndMapResults = require('../private/search_and_map_results');

/**
 * Update all matching instances
 * @param {String} model The model name
 * @param {Object} where The search criteria
 * @param {Object} data The property/value pairs to be updated
 * @callback {Function} apiCallback Callback function
 */
module.exports = function(model, where, data, apiCallback){
  var self = this;

  searchAndMapResults(this, modelName, { where: where }, function(modelName, id, mapCallback){
    self.updateAttributes(modelName, id, data, mapCallback);
  }, apiCallback);
};
