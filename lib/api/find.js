'use strict';

var jsonToNativeTypes  = require('../private/json_to_native_types');
var bucketNameComposer = require('../private/bucket_name_composer');

/**
 * Find a model instance by id
 * @param {String} modelName The model name
 * @param {*} id The id value
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, id, apiCallback){
  var self = this;

  this.db.fetchValue({
    bucket:      bucketNameComposer(this, modelName),
    key:         id,
    convertToJs: true
  }, function(error, response){
    if (error) return apiCallback(error);

    if (!response || !response.values[0] || !response.values[0].value) return apiCallback(null, null);

    apiCallback(error, jsonToNativeTypes(self, modelName, response.values[0].value));
  });
};
