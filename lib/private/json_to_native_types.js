'use strict';

// NOTE: most of this code is from the redis connector
// https://github.com/strongloop/loopback-connector-redis/blob/master/lib/redis.js
module.exports = function (riak, modelName, data, fields) {
  fields = fields || {};

  var p = riak._models[modelName].properties, d;

  for (var i in data) {
    if(!isIncluded(fields, i)) {
      // Exclude
      delete data[i];
      continue;
    }

    if (!p[i]) continue;

    if (!data[i]) {
      data[i] = "";
      continue;
    }

    switch (p[i].type.name) {
    case "Date":
      d = new Date(data[i]);
      data[i] = d;
      break;
    case "Number":
      data[i] = Number(data[i]);
      break;
    case "Boolean":
      data[i] = data[i] === "true" || data[i] === "1";
      break;
    case "String":
    case "Text":
      break;
    default:
      d = data[i];
      try {
        data[i] = JSON.parse(data[i]);
      }
      catch(e) {
        data[i] = d;
      }
    }
  }

  return data;

  /*
    *!
    * Decide if a field should be included
    * @param {Object} fields
    * @returns {Boolean}
    * @private
  */
  function isIncluded(fields, f) {
    if(!fields) {
      return true;
    }
    if(Array.isArray(fields)) {
      return fields.indexOf(f) >= 0;
    }
    if(fields[f]) {
      // Included
      return true;
    }
    if((f in fields) && !fields[f]) {
      // Excluded
      return false;
    }
    for(var f1 in fields) {
      return !fields[f1]; // If the fields has exclusion
    }
    return true;
  }
};
