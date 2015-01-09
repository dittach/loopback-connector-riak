'use strict'

var deepExtend = require('deep-extend');

/* public API */

var Riak = require('./private/riak');

deepExtend(Riak.prototype, {
  connect:          require('./api/connect'),
  create:           require('./api/create'),
  getTypes:         require('./api/get_types'),
  save:             require('./api/save'),
  exists:           require('./api/exists'),
  find:             require('./api/find'),
  updateOrCreate:   require('./api/update_or_create'),
  destroy:          require('./api/destroy'),
  all:              require('./api/all'),
  destroyAll:       require('./api/destroy_all'),
  count:            require('./api/count'),
  updateAttributes: require('./api/update_attributes'),
  updateAll:        require('./api/update_all'),
  disconnect:       require('./api/disconnect'),
  ping:             require('./api/ping')
});

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
