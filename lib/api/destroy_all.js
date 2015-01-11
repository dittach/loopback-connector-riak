'use strict';

var searchAndMapResults = require('../private/search_and_map_results');

/**
 * Delete all instances for the given model
 * @param {String} model The model name
 * @param {Object} [where] The filter for where
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(model, where, apiCallback){
  searchAndMapResults(this, modelName, where, this.destroy.bind(this), apiCallback);
};
