'use strict';

var riak = require('riak-js');

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

  this.db = riak({host: this.settings.host, port: this.settings.port});
  this._models = {};

  this.db.ping(function(error, response){
    if (error)         onConnectionFailure(error);
    else if (response) onConnectionSuccess();
    else               onUnexpectedError();

    apiCallback && apiCallback(error, self.db);
  });

  function onConnectionSuccess(){
    self._logger('connection is established host:', self.settings.host, "port:", self.settings.port);
  }

  function onConnectionFailure(error){
    self._logger('connection failed:', error);
  }

  function onUnexpectedError(){
    self._logger("unexpected issue connecting to Riak");
  }
}
