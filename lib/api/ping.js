'use strict';

module.exports = function(apiCallback){
  this.db.ping(apiCallback);
};
