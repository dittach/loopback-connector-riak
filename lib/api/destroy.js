'use strict';

/**
 * Delete a model instance by key
 * @param {String} modelName The model name
 * @param {*} key The key value
 * @param [apiCallback] The callback function
 */
module.exports = function(modelName, key, apiCallback){
  this.db.remove(modelName, { id: key }, apiCallback);
};
