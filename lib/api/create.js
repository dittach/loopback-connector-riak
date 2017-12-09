'use strict';

var async = require('neo-async');
var uuid = require('uuid');
var bucketNameComposer = require('../private/bucket_name_composer');

/**
 * Create a new model instance for the given data
 * @param {String} modelName The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, data, apiCallback){
  var self       = this;
  var bucketName = bucketNameComposer(this, modelName);

  var id = data.id || uuid.v1();
  data.id = data.id || id;

  self.db.storeValue({
    bucket:           bucketName,
    key:              id,
    value:            data,
    returnBody:       false,
    conflictResolver: function(objects){
      return objects.shift();
    }
  }, function(error, result){
    apiCallback(error, id);
  });
};
