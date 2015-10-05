'use strict';

var bucketNameComposer = require('../private/bucket_name_composer');

/**
 * Check if a model instance exists by id
 * @param {String} modelName The model name
 * @param {*} id The id value
 * @param {Function} [apiCallback] The callback function
 *
 */
module.exports = function(modelName, id, apiCallback){
  this.db.fetchValue({
    bucket: bucketNameComposer(this, modelName),
    key:    id
  }, function(error, result){
    console.log("!!!!!!!!!!!! exists", result);
    apiCallback(null, !!result);
  });
};
