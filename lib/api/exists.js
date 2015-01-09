'use strict';

/**
 * Check if a model instance exists by key
 * @param {String} modelName The model name
 * @param {*} key The key value
 * @param {Function} [apiCallback] The callback function
 *
 */
module.exports = function(modelName, key, apiCallback){
  this.db.exists(modelName, key, {}, apiCallback);
};
