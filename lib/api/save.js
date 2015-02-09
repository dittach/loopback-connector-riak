'use strict';

var bucketNameComposer = require('../private/bucket_name_composer');

/**
 * Save the model instance for the given data
 * @param {String} modelName The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, data, apiCallback){
  var id = data.id;
  if (!id) return apiCallback('save called for a document with no id');

  this.db.save(bucketNameComposer(this, modelName), id, data, { returnbody: true }, apiCallback);
};
