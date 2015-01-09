// Note that it appears that loopback uses the connector's destroyAll,
// updateAll, and all to operate even on singular documents.  I'm not
// sure whether it uses destroy, update, and find at all or whether
// these are intended to be private methods for the connector.

/*!
 * Module dependencies
 */
var riak       = require('riak-js');
var util       = require('util');
var deepExtend = require('deep-extend');
var async      = require('async');
var Connector  = require('loopback-connector').Connector;

/**
 * The constructor for Riak connector
 * @param {Object} settings The settings object
 * @param {DataSource} dataSource The data source instance
 * @constructor
 */
function Riak(settings, dataSource){
  this.name       = 'riak';
  this.settings   = settings;
  this.debug      = !!settings.debug;
  this.dataSource = dataSource;
}

/**
 * Initialize the Riak connector for the given data source
 * @param {DataSource} dataSource The data source instance
 * @param {Function} [apiCallback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource, callback){
  dataSource.connector            = new Riak(dataSource.settings, dataSource);
  dataSource.connector.dataSource = dataSource;

  if (callback) dataSource.connector.connect(callback);
};

util.inherits(Riak, Connector);

//
// "public" methods (Loopback connector API implementation)
//

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
  var self = this;

  this.db = riak({host: self.settings.host, port: self.settings.port});
  this._models = {};

  self.ping(function(error, response){
    if (error)         self._onConnectionFailure(error);
    else if (response) self._onConnectionSuccess();
    else               self._onUnexpectedError("connecting to Riak");

    apiCallback && apiCallback(error, self.db);
  });
};

Riak.prototype.getTypes = function(){
  return ['db', 'nosql', 'riak'];
};

/**
 * Create a new model instance for the given data
 * @param {String} modelName The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
Riak.prototype.create = function(modelName, data, apiCallback){
  var self = this;

  var key = data.key;
  if (!key) throw new Error('Riak create called for a document with no key');

  async.waterfall([
    checkExistance,
    store
  ], apiCallback);

  function checkExistance(callback){
    self.db.exists(modelName, key, function(error, exists){
      if (exists) return callback(self._consoleLog("key conflict during create for key", key));

      callback(error, exists);
    });
  }

  function store(exists, callback){
    self.db.save(modelName, key, data, { returnbody: true }, callback);
  }
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
  var self = this;

  async.waterfall([
    update,
    create
  ], apiCallback);

  function update(callback){
    self.updateAttributes(modelName, data.key, data, function(error, updatedDocument){
      if (error || !results) callback(null, false);

      callback(null, updatedDocument);
    });
  }

  function create(updatedDocument, callback){
    if (updatedDocument) return callback(null, updatedDocument);

    self.create(modelName, data, callback);
  }

  throw new Error('updateOrCreate is not currently supported in Riak');
};

/**
 * Delete a model instance by key
 * @param {String} modelName The model name
 * @param {*} key The key value
 * @param [apiCallback] The callback function
 */
Riak.prototype.destroy = function(modelName, key, apiCallback){
  this.db.remove(modelName, { id: key }, apiCallback);
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
  // what's up with "ACL" being sent in here?
  if (modelName === "ACL") return apiCallback(null);

  this._searchAndMapResults(modelName, where, this.find, apiCallback);
};

/**
 * Delete all instances for the given model
 * @param {String} model The model name
 * @param {Object} [where] The filter for where
 * @param {Function} [apiCallback] The callback function
 */
Riak.prototype.destroyAll = function(model, where, apiCallback){
  this._searchAndMapResults(modelName, where, this.destroy, apiCallback);
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
  this.db.yokozuna.find(
    modelName,
    this._conditionsToQueryString(modelName, where),
    [
      {
        "map": {
          "language": "javascript",
          "keep": false,
          "source": "function(v) { return [1]; }"
        }
      },
      {
        "reduce": {
          "language": "javascript",
          "keep": true,
          "name": "Riak.reduceSum"
        }
      }
    ],
    // TODO: see what kind of a result we get back from the map reduce
    function(error, data){
      var statusCode = error && error.statusCode;

      if (statusCode === 404) return apiCallback("Not found", null);
      if (statusCode)         return apiCallback(error.message);

      apiCallback(data);
    }
  );
};

/**
 * Update properties for the model instance data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [apiCallback] The callback function
 */
Riak.prototype.updateAttributes = function(modelName, key, data, apiCallback){
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
      if (!result) return callback(self._consoleLog("updateAttributes failed to find a Riak document for key", key));

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

/**
 * Update all matching instances
 * @param {String} model The model name
 * @param {Object} where The search criteria
 * @param {Object} data The property/value pairs to be updated
 * @callback {Function} apiCallback Callback function
 */
Riak.prototype.update = Riak.prototype.updateAll = function(model, where, data, apiCallback){
  var self = this;

  this._searchAndMapResults(modelName, where, function(modelName, key, mapCallback){
    self.updateAttributes(modelName, key, data, mapCallback);
  }, apiCallback);
};

/**
 * Disconnect from Riak
 */
Riak.prototype.disconnect = function(callback){
  // no-op
  if (callback) callback();
};

Riak.prototype.ping = function(apiCallback){
  this.db.ping(apiCallback);
};

//
// "private" methods
//

Riak.prototype._onConnectionSuccess = function(){
  this._consoleLog('connection is established host:', this.settings.host, "port:", this.settings.port);
};

Riak.prototype._onConnectionFailure = function(error){
  this._consoleLog('connection failed:', error);
};

Riak.prototype._onUnexpectedError = function(activity){
  this._consoleLog('unexpected error while', activity);
};

Riak.prototype._notImplemented = function(action){
  throw new Error('Riak connector ' + action.toString() + ' not yet implemented');
};

Riak.prototype._consoleLog = function(){
  if (!this.debug)            return;
  if (arguments.length === 0) return;

  var message = Array.prototype.slice.call(arguments).
      map(function(arg){
        return [ "string", "number" ].indexOf(typeof(arg)) !== -1 ? arg : util.inspect(arg);
      }).join(" ");

  console.log("Riak connector", message);

  return message;
};

Riak.decimalSearchRegExp = /\./gi;
Riak.prototype._conditionsToQueryString = function(modelName, where){
  var properties = this._models[modelName] && this._models[modelName].properties;
  if (!properties) return;

  return componentizeQueries().join(" AND ");

  /* helpers */

  function hasProperty(propertyName){
    return !!properties[propertyName];
  }

  function componentizeQueries(){
    var queryComponents = [];

    for (var propertyName in where){
      if (hasProperty(propertyName)){
        queryComponents.push(
          componentizeQuery(propertyName, where[propertyName])
        );
      }
    };

    return queryComponents;
  }

  function componentizeQuery(propertyName, propertyQuery){
    return [
      propertyName,
      propertyTypeSuffix(propertyName),
      ":",
      escapeQuery(propertyQuery)
    ].join("");
  }

  function propertyType(propertyName){
    return properties[propertyName] &&
           properties[propertyName].riak &&
           properties[propertyName].riak.indexType || "string";
  }

  function propertyTypeSuffix(propertyName){
    // this is a pretty dumb simplification but Riak's documentation
    // just says: "_s represents a string, _i is an integer, _b is
    // binary and so on)."
    return [
      "_",
      propertyType(propertyName)[0] // "and so on"
    ].join("");
  }

  function escapeQuery(query){
    // TODO: proper escaping
    return query;
  }
};

// TODO: what happens when indexes are queried with conditions that
// aren't indexed. error? crash? ignored?
Riak.prototype._search = function(modelName, where, apiCallback){
  this.db.yokozuna.find(
    modelName,
    this._conditionsToQueryString(modelName, where),
    {},
    function(error, data){
      var statusCode = error && error.statusCode;

      if (statusCode === 404) return apiCallback("Not found", null);
      if (statusCode)         return apiCallback(error.message);

      apiCallback(data);
    }
  );
};

Riak.prototype._searchAndMapResults = function(modelName, where, mapIterator, callback){
  var self = this;

  async.waterfall([
    search,
    mapResults,
    parallelize
  ], apiCallback);

  function search(callback){
    self._search(modelName, where, function(error, results){
      if (error) return callback(error);

      // TODO: extract results keys
      callback(null, results);
    });
  }

  function mapResultsToRemoveQueries(searchResultKeys, callback){
    callback(null, searchResultKeys.map(function(key){
      return function(mapCallback){
        mapIterator(modelName, key, mapCallback);
      }
    }));
  }

  function parallelize(removeQueries, callback){
    async.parallel(removeQueries, callback);
  }
}
