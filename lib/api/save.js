'use strict';

/**
 * Save the model instance for the given data
 * @param {String} modelName The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, data, apiCallback){
  var key = data.key;
  if (!key) throw new Error('Riak save called for a document with no key');

  this.db.save(modelName, key, data, { returnbody: true }, apiCallback);
};
