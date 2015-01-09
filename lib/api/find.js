'use strict';

/**
 * Find a model instance by key
 * @param {String} modelName The model name
 * @param {*} key The key value
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, key, apiCallback){
  this.db.get(modelName, key, apiCallback);
};
