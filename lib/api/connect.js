'use strict';

var Riak = require('basho-riak-client');

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
module.exports = function(apiCallback){
  var self = this;

  if (!Array.isArray(this.settings.host)) this.settings.host = [ this.settings.host ];

  this.db = new Riak.Client(this.settings.host);
  this._models = this._models || {};

  if (!apiCallback) return;

  this.ping(function(error, response){
    if (error)         onConnectionFailure(error);
    else if (response) onConnectionSuccess();
    else               onUnexpectedError();

    apiCallback(error, self.db);
  });

  function onConnectionSuccess(){
    self._logger('connection is established to host:', self.settings.host);
  }

  function onConnectionFailure(error){
    self._logger('connection failed:', error);
  }

  function onUnexpectedError(){
    self._logger("unexpected issue connecting to Riak");
  }
}
