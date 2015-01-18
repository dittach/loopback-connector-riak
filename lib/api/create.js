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

  var id = data.id;
  if (!id) throw new Error('Riak create called for a document with no id');

  async.waterfall([
    checkExistance,
    store
  ], apiCallback);

  function checkExistance(callback){
    self.db.exists(modelName, id, function(error, exists){
      if (exists) return callback(self._logger("id conflict during create for id", id));

      callback(error, exists);
    });
  }

  function store(exists, callback){
    self.db.save(modelName, id, data, { returnbody: false }, function(error, result){
      callback(error, id);
    });
  }
};
