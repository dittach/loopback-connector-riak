'use strict';

var jsonToNativeTypes = require('../private/json_to_native_types');

/**
 * Find a model instance by id
 * @param {String} modelName The model name
 * @param {*} id The id value
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, id, apiCallback){
  var self = this;

  this.db.get(modelName, id, function(error, result){
    apiCallback(error, jsonToNativeTypes(self, modelName, result));
  });
};
