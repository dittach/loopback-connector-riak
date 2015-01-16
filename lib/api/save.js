'use strict';

/**
 * Save the model instance for the given data
 * @param {String} modelName The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, data, apiCallback){
  var id = data.id;
  if (!id) throw new Error('Riak save called for a document with no id');

  this.db.save(modelName, id, data, { returnbody: true }, apiCallback);
};
