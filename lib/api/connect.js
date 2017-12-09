'use strict';

var Riak = require('basho-riak-client');
var deepExtend = require('deep-extend');


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
    var nodes = [];

    this.settings.node_config = this.settings.node_config || {};

    var defaultNodeConfig = {
        "maxConnections": 128,
        "minConnections": 1,
        "idleTimeout": 10000,
        "connectionTimeout": 3000,
        "requestTimeout": 5000,
        "cork": true
    };

    deepExtend(this.settings.node_config, defaultNodeConfig);

    for (var i = 0; i < this.settings.host.length; i++) {
        var nodeConfig = this.settings.node_config;
        nodeConfig.remoteAddress = this.settings.host[i];
        nodes.push(new Riak.Node(nodeConfig));
    }

    var cluster = new Riak.Cluster({
        nodes: nodes
    });

    this._models = this._models || {};
    this.db = new Riak.Client(cluster, function (err, client) {
        if (err) onConnectionFailure(err);
        else if (client) onConnectionSuccess();
        else onUnexpectedError();

        apiCallback(err, self.db);
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
