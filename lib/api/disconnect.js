'use strict';

/**
 * Disconnect from Riak
 */
module.exports = function(callback){
  delete(this.db);

  // no-op
  if (callback) callback();
};
