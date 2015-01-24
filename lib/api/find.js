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

  this.db.get(bucketNameComposer(this, modelName), id, function(error, result){
    apiCallback(error, jsonToNativeTypes(self, modelName, result));
  });
};
