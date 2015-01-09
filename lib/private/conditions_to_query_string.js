'use strict';

module.exports = function(riak, modelName, where){
  var properties = riak._models[modelName] && riak._models[modelName].properties;
  if (!properties) return;

  return componentizeQueries().join(" AND ");

  /* helpers */

  function hasProperty(propertyName){
    return !!properties[propertyName];
  }

  function componentizeQueries(){
    var queryComponents = [];

    for (var propertyName in where){
      if (hasProperty(propertyName)){
        queryComponents.push(
          componentizeQuery(propertyName, where[propertyName])
        );
      }
    };

    return queryComponents;
  }

  function componentizeQuery(propertyName, propertyQuery){
    return [
      propertyName,
      propertyTypeSuffix(propertyName),
      ":",
      escapeQuery(propertyQuery)
    ].join("");
  }

  function propertyType(propertyName){
    return properties[propertyName] &&
           properties[propertyName].riak &&
           properties[propertyName].riak.indexType || "string";
  }

  function propertyTypeSuffix(propertyName){
    // this is a pretty dumb simplification but Riak's documentation
    // just says: "_s represents a string, _i is an integer, _b is
    // binary and so on)."
    return [
      "_",
      propertyType(propertyName)[0] // "and so on"
    ].join("");
  }

  function escapeQuery(query){
    // TODO: proper escaping
    return query;
  }
}
