'use strict';

/*!
 * Module dependencies
 */
var util      = require('util');
var Connector = require('loopback-connector').Connector;
var logger    = require('../private/logger');

/**
 * The constructor for Riak connector
 * @param {Object} settings The settings object
 * @param {DataSource} dataSource The data source instance
 * @constructor
 */
var Riak = module.exports = function(settings, dataSource){
  this.name       = 'riak';
  this.settings   = settings;
  this.debug      = !!settings.debug;
  this.dataSource = dataSource;
  this._logger    = logger;
}

util.inherits(Riak, Connector);
