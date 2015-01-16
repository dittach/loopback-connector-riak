'use strict';

var async      = require('async');
var deepExtend = require('deep-extend');

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
      if (!result) return callback(self._logger("updateAttributes failed to find a Riak document for id", id));

      callback(error, result);
    });
  }

  function merge(document, callback){
    callback(null, deepExtend(document, data));
  }

  function save(updatedDocument, callback){
    self.db.save(modelName, id, updatedDocument, callback);
  }
};
