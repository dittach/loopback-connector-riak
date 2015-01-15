'use strict';

var async  = require('async');

/**
 * Create a new model instance for the given data
 * @param {String} modelName The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
module.exports = function(modelName, data, apiCallback){
  var self = this;
  var modelSpec = this._models[modelName];

  var key = data.key || data.id;
  if (!key) throw new Error('Riak create called for a document with no key');

  async.waterfall([
    checkExistance,
    store
  ], apiCallback);

  function checkExistance(callback){
    self.db.exists(modelName, key, function(error, exists){
      if (exists) return callback(self._logger("key conflict during create for key", key));

      callback(error, exists);
    });
  }

  function store(exists, callback){
    self.db.save(modelName, key, data, { returnbody: true }, callback);
  }
};
