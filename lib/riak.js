/*!
 * Module dependencies
 */
var riak = require('riak-js');
var util = require('util');
var Connector = require('loopback-connector').Connector;
var debug = require('debug')('loopback:connector:riak');

/**
 * Initialize the Riak connector for the given data source
 * @param {DataSource} dataSource The data source instance
 * @param {Function} [callback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource){
  if (!riakjs) return;

  dataSource.connector = riak(datasource.settings);
};

/**
 * The constructor for Riak connector
 * @param {Object} settings The settings object
 * @param {DataSource} dataSource The data source instance
 * @constructor
 */
function Riak(settings, dataSource){
  Connector.call(this, 'riak', settings);

  this.debug = settings.debug || debug.enabled;

  if (this.debug) debug('Settings: %j', settings);

  this.dataSource = dataSource;
}

function log(){
  if (!self.debug)            return;
  if (arguments.length === 0) return;

  var message = Array.prototype.slice.call(arguments).
    map(function(arg){
      arg.toString();
    }).join(" ");

  debug(message);
}

util.inherits(Riak, Connector);

/**
 * Connect to Riak
 * RiakJS doesn't connect per se but we'll ping the db to make sure it
 * works.
 *
 * @param {Function} [callback] The callback function
 *
 * @callback callback
 * @param {Error} err The error object
 * @param {Db} db The riak client object
 */
Riak.prototype.connect = function(callback){
  this.db = riak.getClient();

  this.ping(function(error, response){
    if (error)          this._onConnectionFailure(error);
    else if (response)  this._onConnectionSuccess();
    else                this._onUnexpectedError("connecting to Riak");

    callback && callback(err, db);
  }.bind(this));
};

Riak.prototype._onConnectionSuccess = function(error){
  log('Riak connection failed:', error);
};

Riak.prototype._onConnectionFailure = function(){
  log('Riak connection is established:', this.settings.host.toString(), this.settings.port.toString());
};

Raik.prototype._onUnexpectedError = function(activity){
  log('Unexpected error while', activity);
};

Raik.prototype._getModelCollectionSpecByName(modelName){
  var modelClass = this._models[model];

  if (!modelClass.settings.riak) return model;

  return modelClass.settings.riak.collection;
};

Riak.prototype.getTypes = function(){
  return ['db', 'nosql', 'riak'];
};

Riak.prototype.getDefaultIdType = function(){
  // TBD
};

/**
 * Access a Riak collection by model name
 * @param {String} model The model name
 * @returns {*}
 */
Riak.prototype.collection = function(model){
  if (!this.db) throw new Error('Riak connection is not established');

  var modelSpec = this._getModelCollectionSpecByName(model)
  return this.db.collection(modelSpec);
};

/*!
 * Convert the data from database to a deliverable format
 * NOTE: Riak stores opaque data so we just return the data
 *
 * @param {String} model The model name
 * @param {Object} data The data from DB
 */
Riak.prototype.fromDatabase = function(model, data){
  return data;
};

/**
 * Create a new model instance for the given data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [callback] The callback function
 */
Riak.prototype.create = function(model, data, callback){
  // db.save
};

/**
 * Save the model instance for the given data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [callback] The callback function
 */
Riak.prototype.save = function(model, data, callback){
  // db.save
};

/**
 * Check if a model instance exists by key
 * @param {String} model The model name
 * @param {*} key The key value
 * @param {Function} [callback] The callback function
 *
 */
Riak.prototype.exists = function(model, key, callback){
  // db.exists
};

/**
 * Find a model instance by key
 * @param {String} model The model name
 * @param {*} key The key value
 * @param {Function} [callback] The callback function
 */
Riak.prototype.find = function find(model, key, callback){
  // db.search
};

/**
 * Update if the model instance exists with the same key or create a new instance
 *
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @param {Function} [callback] The callback function
 */
Riak.prototype.updateOrCreate = function updateOrCreate(model, data, callback){
  // find. if found merge data. save
};

/**
 * Delete a model instance by key
 * @param {String} model The model name
 * @param {*} key The key value
 * @param [callback] The callback function
 */
Riak.prototype.destroy = function destroy(model, key, callback){
  // db.remove
};


/**
 * Find matching model instances by the filter
 *
 * @param {String} model The model name
 * @param {Object} filter The filter
 * @param {Function} [callback] The callback function
 */
Riak.prototype.all = function all(model, filter, callback){
// db.search
};

/**
 * Delete all instances for the given model
 * @param {String} model The model name
 * @param {Object} [where] The filter for where
 * @param {Function} [callback] The callback function
 */
Riak.prototype.destroyAll = function destroyAll(model, where, callback){
  // db.remove
};

/**
 * Count the number of instances for the given model
 *
 * @param {String} model The model name
 * @param {Function} [callback] The callback function
 * @param {Object} filter The filter for where
 *
 */
Riak.prototype.count = function count(model, callback, where){
  // db.count
};

/**
 * Update properties for the model instance data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [callback] The callback function
 */
Riak.prototype.updateAttributes = function updateAttrs(model, key, data, callback){
  // find. merge. save
};

/**
 * Update all matching instances
 * @param {String} model The model name
 * @param {Object} where The search criteria
 * @param {Object} data The property/value pairs to be updated
 * @callback {Function} callback Callback function
 */
Riak.prototype.update =
  Riak.prototype.updateAll = function updateAll(model, where, data, callback){
    // search. iterate. merge. save
  };

/**
 * Disconnect from Riak
 */
Riak.prototype.disconnect = function(){
  // no-op
};

Riak.prototype.ping = function(callback){
  this.db.ping(callback);
};
