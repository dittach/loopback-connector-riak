'use strict';

var bucketNameComposer = require('../private/bucket_name_composer');

/**
 * Delete a model instance by id
 * @param {String} modelName The model name
 * @param {*} id The id value
 * @param [apiCallback] The callback function
 */
module.exports = function(modelName, id, apiCallback){
  this.db.deleteValue({
    bucket: bucketNameComposer(this, modelName),
    key:    id
  }, apiCallback);
};
