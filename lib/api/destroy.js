'use strict';

/**
 * Delete a model instance by id
 * @param {String} modelName The model name
 * @param {*} id The id value
 * @param [apiCallback] The callback function
 */
module.exports = function(modelName, id, apiCallback){
  this.db.remove(modelName, { id: id }, apiCallback);
};
