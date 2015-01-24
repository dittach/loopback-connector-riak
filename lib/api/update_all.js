'use strict';

var searchAndMapResults = require('../private/search_and_map_results');
var bucketNameComposer  = require('../private/bucket_name_composer');

/**
 * Update all matching instances
 * @param {String} model The model name
 * @param {Object} where The search criteria
 * @param {Object} data The property/value pairs to be updated
 * @callback {Function} apiCallback Callback function
 */
module.exports = function(model, where, data, apiCallback){
  var self       = this;
  var bucketName = bucketNameComposer(this, modelName);

  searchAndMapResults(this, bucketName, { where: where }, function(modelName, id, mapCallback){
    self.updateAttributes(modelName, id, data, mapCallback);
  }, apiCallback);
};
