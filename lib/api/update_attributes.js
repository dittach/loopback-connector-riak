'use strict';

var async = require('neo-async');
var extend             = require('util')._extend;
var bucketNameComposer = require('../private/bucket_name_composer');

/**
 * Update properties for the model instance data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, id, data, apiCallback){
  var self = this;

  if (!id) throw new Error('Riak updateAttributes called for a document with no id');

  async.waterfall([
    find,
    merge,
    save
  ], apiCallback);

  function find(callback){
    self.find(modelName, id, function(error, result){
      if (error)   return callback(error);
      if (!result) return apiCallback(null, null);

      callback(error, result);
    });
  }

  function merge(document, callback){
    callback(null, extend(document, data));
  }

  function save(updatedDocument, callback){
    self.save(bucketNameComposer(self, modelName), updatedDocument, function(error, success){
      if (error) return callback(error);

      callback(null, updatedDocument);
    });
  }
};
