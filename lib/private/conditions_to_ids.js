'use strict';

module.exports = function(conditions){
  conditions.where = conditions.where || {};

  var where = conditions && conditions.where;
  var id = conditions.where.id;

  if (!isQueryingJustById()) return null;

  // ..otherwise ensure we have an array of ids
  return flatten([ id ]);

  function isQueryingJustById(){
    // Object indicates a search
    if (id && id.constructor === Object) return false;

    return id && where && Object.keys(where).length === 1;
  }

  function flatten(ids){
    var merged = [];
    return merged.concat.apply(merged, ids);
  }
}
