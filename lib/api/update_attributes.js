'use strict';

var async      = require('async');
var deepExtend = require('deep-extend');

/**
 * Update properties for the model instance data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, key, data, apiCallback){
  var self = this;

  if (!key) throw new Error('Riak updateAttributes called for a document with no key');

  async.waterfall([
    find,
    merge,
    save
  ], apiCallback);

  function find(callback){
    self.find(modelName, key, function(error, result){
      if (error)   return callback(error);
      if (!result) return callback(self._logger("updateAttributes failed to find a Riak document for key", key));

      callback(error, result);
    });
  }

  function merge(document, callback){
    callback(null, deepExtend(document, data));
  }

  function save(updatedDocument, callback){
    self.db.save(modelName, key, updatedDocument, callback);
  }
};
