'use strict';

var jsonToNativeTypes = require('../private/json_to_native_types');

/**
 * Find a model instance by key
 * @param {String} modelName The model name
 * @param {*} key The key value
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, key, apiCallback){
  var self = this;

  this.db.get(modelName, key, function(error, result){
    apiCallback(error, jsonToNativeTypes(self, modelName, result));
  });
};
