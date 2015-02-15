'use strict';

module.exports = function(conditions){
  if (!isQueryingJustById()) return null;

  conditions.where = conditions.where || {};

  // ensure we have an array
  return flatten([ conditions.where.id ]);

  function isQueryingJustById(){
    var where = conditions && conditions.where;
    var id    = where && conditions.where.id;

    // Object indicates a search
    if (id && id.constructor === Object) return false;

    return id && where && Object.keys(where).length === 1;
  }

  function flatten(ids){
    var merged = [];
    return merged.concat.apply(merged, ids);
  }
}
