'use strict';

var escapeRegExp = function(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// see http://lucene.apache.org/core/3_0_3/queryparsersyntax.html#Escaping%20Special%20Characters
var SOLR_ESCAPE_CHARACTERS = ["\\", "+", "-", "!", "(", ")", ":", ";", "^", "[", "]", "{", "}", "~", "*", "?"];
var SOLR_ESCAPE_REGEXP = new RegExp([
  "(",
  SOLR_ESCAPE_CHARACTERS.map(function(character){
    return escapeRegExp(character);
  }).join("|"),
  ")"
].join(""), "gi");

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
    // TODO: this is safe, right? you can't send some crazy non-string
    // thing in and make it evaluate to an unsafe string, right?
    // asking for a friend here
    if (typeof(query) !== "string") return query;

    return query.replace(SOLR_ESCAPE_REGEXP, "\\$1"). // escape Solr query characters
                 replace(/(\s)/gi, "\\$1");            // escape white space
  }
}
