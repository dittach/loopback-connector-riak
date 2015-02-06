'use strict';

var bucketNameComposer = require('./bucket_name_composer');

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
module.exports = function(riak, bucketName, where){
  var modelName = bucketNameComposer.decompose(riak, bucketName);

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

  function formatQuery(propertyName, propertyQuery, escape){
    return [
      fieldName(propertyName),
      ":",
      escapeQuery(propertyQuery)
    ].join("");
  }

  function splitQuery(query){
    // FIXME: this is dumb but a regexp wizard I am not. the desired
    // outcome is to split on commas but not on escaped commas
    return query.
           split('').
           reverse().
           join('').                                    // reverse the query
           split(/,(?!\\)/).                            // split on non-escaped commas
           map(function(str){
             return str.split("").reverse("").join(""). // unreverse the components
                    replace(/\\,/gi, ",");              // re-comma-ify
           }).reverse();                                // unreverse the query
  }

  function componentizeQuery(propertyName, propertyQuery){
    switch(propertyQuery.constructor){
    case Object:
      return parseObjectPropertyQuery(propertyName, propertyQuery);
      break;
    case String:
      return splitQuery(propertyQuery).map(function(property){
        return formatQuery(propertyName, property);
      }).join(" AND ");
      break;
    case Date:
      return formatQuery(propertyName, propertyQuery.toISOString());
      break;
    default:
      return formatQuery(propertyName, propertyQuery);
      break;
    }
  }

  function parseObjectPropertyQuery(propertyName, propertyQuery){
    // yeah, this doesn't allow multiple operators but, upon
    // investigation, neither do the other adapters (MongoDB, etc)
    var operator = Object.keys(propertyQuery)[0];
    var query    = propertyQuery[operator];

    // MongoDB connector implementation reference:
    //
    // if (spec === 'between') {
    //   query[k] = { $gte: cond[0], $lte: cond[1]};
    // } else if (spec === 'inq') {
    //   query[k] = { $in: cond.map(function (x) {
    //     if ('string' !== typeof x) return x;
    //     return ObjectID(x);
    //   })};
    // } else if (spec === 'like') {
    //   query[k] = {$regex: new RegExp(cond, options)};
    // } else if (spec === 'nlike') {
    //   query[k] = {$not: new RegExp(cond, options)};
    // } else if (spec === 'neq') {
    //   query[k] = {$ne: cond};
    // }
    switch(operator){
    case "between":
      return [ // example: price:[1 TO 10]
        fieldName(propertyName),
        ":[",
        escapeQuery(query[0]),
        " TO ",
        escapeQuery(query[1]),
        "]"
      ].join("");

      break;
    }
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
           properties[propertyName].riak.yzField) || propertyName;
  }

  function escapeQuery(query){
    // TODO: this is safe, right? you can't send some crazy non-string
    // thing in and make it evaluate to an unsafe string, right?
    // asking for a friend here
    if (typeof(query) !== "string") return query;

    return query.replace(SOLR_ESCAPE_REGEXP, "\\$1"). // escape Solr query characters
                 replace(/(\s)/gi, "\\$1");            // escape white space
  }

  function range(propertyName, from, to){
    from = from || "*";
    to   = to   || "*";

    return [ "[", from, " TO ", to, "]" ].join("");
  }
}
