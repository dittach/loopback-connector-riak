'use strict';

// TODO: convert data types to appropriate format for solr
// TODO: support range queries
// TODO: escape query string components to avoid injection attacks
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
      fieldName(propertyName),
      ":",
      escapeQuery(propertyQuery)
    ].join("");
  }

  // you can map the property to a custom field name by specifying a
  // "yzField" key in the "riak" namespace of the field definition in
  // the Loopback model JSON spec.
  //
  // Example:
  //  "file_location": {
  //     "type": "string",
  //     "required": true,
  //     "riak": {
  //       "yzField": "file_url"
  //     }
  //   }
  function fieldName(propertyName){
    propertyName = escapeQuery(propertyName);

    return (properties[propertyName] &&
           properties[propertyName].riak &&
           properties[propertyName].riak.yzField) || propertyName.toLowerCase();
  }

  function escapeQuery(query){
    // TODO: proper escaping
    return query;
  }
}
