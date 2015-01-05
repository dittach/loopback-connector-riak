/*!
 * Module dependencies
 */
var riak       = require('riak-js');
var util       = require('util');
var deepExtend = require('deep-extend');
var async      = require('async');
var Connector  = require('loopback-connector').Connector;
var debug      = require('debug')('loopback:connector:riak');

/**
 * Initialize the Riak connector for the given data source
 * @param {DataSource} dataSource The data source instance
 * @param {Function} [apiCallback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource){
  if (!riak) return;

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

  return message;
}

util.inherits(Riak, Connector);

/**
 * Connect to Riak
 * RiakJS doesn't connect per se but we'll ping the db to make sure it
 * works.
 *
 * @param {Function} [apiCallback] The callback function
 *
 * @callback callback
 * @param {Error} err The error object
 * @param {Db} db The riak client object
 */
Riak.prototype.connect = function(apiCallback){
  this.db = riak.getClient();

  this.ping(function(error, response){
    if (error)          this._onConnectionFailure(error);
    else if (response)  this._onConnectionSuccess();
    else                this._onUnexpectedError("connecting to Riak");

    apiCallback && apiCallback(err, db);
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

/**
 * Create a new model instance for the given data
 * @param {String} modelName The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
Riak.prototype.create = function(modelName, data, apiCallback){
  var key = data.key;
  if (!key) throw new Error('Riak create called for a document with no key');

  async.waterfall([
    checkExistance,
    store
  ], apiCallback);

  function checkExistance(callback){
    this.db.exists(modelName, key, function(error, exists){
      if (exists) return callback(log("Key conflict during create for key", key));

      callback(error, exists);
    });
  }.bind(this);

  function store(exists, callback){
    this.db.save(modelName, key, data, { returnbody: true }, callback);
  }.bind(this);
};

/**
 * Save the model instance for the given data
 * @param {String} modelName The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
Riak.prototype.save = function(modelName, data, apiCallback){
  var key = data.key;
  if (!key) throw new Error('Riak save called for a document with no key');

  this.db.save(modelName, key, data, { returnbody: true }, apiCallback);
};

/**
 * Check if a model instance exists by key
 * @param {String} modelName The model name
 * @param {*} key The key value
 * @param {Function} [apiCallback] The callback function
 *
 */
Riak.prototype.exists = function(modelName, key, apiCallback){
  this.db.exists(modelName, key, {}, apiCallback);
};

/**
 * Find a model instance by key
 * @param {String} modelName The model name
 * @param {*} key The key value
 * @param {Function} [apiCallback] The callback function
 */
Riak.prototype.find = function(modelName, key, apiCallback){
  this.db.get(modelName, key, apiCallback);
};

/**
 * Update if the model instance exists with the same key or create a new instance
 *
 * @param {String} modelName The model name
 * @param {Object} data The model instance data
 * @param {Function} [apiCallback] The callback function
 */
Riak.prototype.updateOrCreate = function(modelName, data, apiCallback){
  throw new Error('updateOrCreate is not currently supported in Riak');
};

/**
 * Delete a model instance by key
 * @param {String} modelName The model name
 * @param {*} key The key value
 * @param [apiCallback] The callback function
 */
Riak.prototype.destroy = function(modelName, key, apiCallback){
  this.db.remove(modelName, key, apiCallback);
};

/**
 * Find matching model instances by the filter
 * WARNING: at the moment this just returns all the things ever
 *
 * @param {String} model The model name
 * @param {Object} filter The filter
 * @param {Function} [apiCallback] The callback function
 */
Riak.prototype.all = function(modelName, conditions, apiCallback){
  // TODO: should probably use _search piped into a parallel get
  this.db.getAll(modelName, {}, apiCallback);
};

// TODO: it's not clear at the moment how to map the conditions param
// to the Riak bucket using the Yokozuna search.  The Yokozuna search
// implementation in RiakJS expects an index and a schema, whereas
// this SQL-ish filter concept is more of an ad-hoc smattering of
// conditions.
//
// most likely we'll want to interrogate the Loopback model spec to
// derive the data types in the provided conditions, then translate
// those conditions to Yokozuna-style queries.  for example, a filter
// of { name: "Jack", age: 31 } might translate into "name_s:Jack AND
// age_i:31"
//
//
// we'll want to test:
// a) what happens when indexes are queried with conditions that
//    aren't indexed. error? crash? ignored?
Riak.prototype._search = function(modelName, conditions, apiCallback){
  // TODO
}

/**
 * Delete all instances for the given model
 * @param {String} model The model name
 * @param {Object} [where] The filter for where
 * @param {Function} [apiCallback] The callback function
 */
Riak.prototype.destroyAll = function(model, where, apiCallback){
  // TODO: probably _search piped into remove
};

/**
 * Count the number of records for the given model
 *
 * @param {String} modelName The model name
 * @param {Function} [apiCallback] The callback function
 * @param {Object} filter The filter for where
 *
 */
Riak.prototype.count = function(modelName, apiCallback, where){
  // TODO: probably mapReduce
};

/**
 * Update properties for the model instance data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
Riak.prototype.updateAttributes = function(modelName, data, apiCallback){
  var key = data.key;
  if (!key) throw new Error('Riak updateAttributes called for a document with no key');

  async.waterfall([
    find,
    merge,
    save
  ], apiCallback);

  function find(callback){
    this.db.find(modelName, key, function(error, result){
      if (error)   return callback(error);
      if (!result) return callback(log("updateAttributes failed to find a Riak document for key", key));

      callback(error, results);
    });
  }.bind(this);

  function merge(document, callback){
    callback(null, deepExtend(document, data));
  }.bind(this);

  function save(updatedDocument, callback){
    this.db.save(modelName, key, updatedDocument, callback);
  }.bind(this);
};

/**
 * Update all matching instances
 * @param {String} model The model name
 * @param {Object} where The search criteria
 * @param {Object} data The property/value pairs to be updated
 * @callback {Function} apiCallback Callback function
 */
Riak.prototype.update =
  Riak.prototype.updateAll = function(model, where, data, apiCallback){
    // TODO: probably:
    // 1. _search
    // 2. iterate -> updateAttributes
  };

/**
 * Disconnect from Riak
 */
Riak.prototype.disconnect = function(){
  // no-op
};

Riak.prototype.ping = function(apiCallback){
  this.db.ping(apiCallback);
};
