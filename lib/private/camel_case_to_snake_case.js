'use strict';

module.exports = function(str){
  return str.replace(/([A-Z])/g, function($1){
    return [ "_", $1.toLowerCase() ].join("");
  }).slice(1);
}
