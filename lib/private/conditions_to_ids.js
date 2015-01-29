'use strict';

module.exports = function(conditions){
  if (!isQueryingJustById()) return null;

  // ensure we have an array
  return flatten([ conditions.where.id ]);

  function isQueryingJustById(){
    var where = conditions && conditions.where;
    var id    = where && conditions.where.id;

    return id && where && Object.keys(where).length === 1;
  }

  function flatten(ids){
    var merged = [];
    return merged.concat.apply(merged, ids);
  }
}
