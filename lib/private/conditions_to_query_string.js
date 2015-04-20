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

  var queries = where.and || where;
  if (queries.constructor !== Array) queries = [ queries ];

  return queries.map(function(query){
    return componentizeFacets(query).join(" AND ");
  }).join(" AND ");

  /* helpers */

  function hasProperty(propertyName){
    return !!properties[propertyName];
  }

  function componentizeFacets(query){
    var facetComponents = [];

    for (var propertyName in query){
      if (hasProperty(propertyName)){
        facetComponents.push(
          componentizeFacet(propertyName, query[propertyName])
        );
      }
    };

    return facetComponents;
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

  function componentizeFacet(propertyName, propertyQuery){
    switch(propertyQuery.constructor){
    case Object:
      return parseObjectPropertyQuery(propertyName, propertyQuery);
      break;
    case Array:
      return andQuery(propertyName, propertyQuery);
      break;
    case String:
      return andQuery(propertyName, splitQuery(propertyQuery));
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
    case "gte":
      // example: price:[10 TO *]
      return rangeQuery(propertyName, query, "*");
      break;
    case "lte":
      // example: price:[* TO 10]
      return rangeQuery(propertyName, "*", query);
      break;
    case "between":
      // example: price:[1 TO 10]
      return rangeQuery(propertyName, query[0], query[1]);
      break;
    case "inq":
      return orQuery(propertyName, query);
      break;
    case "like":
      return likeQuery(propertyName, query);
      break;
    case "nlike":
      return notLikeQuery(propertyName, query);
      break;
    case "neq":
      return notEqualQuery(propertyName, query);
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
    switch(query.constructor){
    case String:
      return query.replace(SOLR_ESCAPE_REGEXP, "\\$1"). // escape Solr query characters
             replace(/(\s)/gi, "\\$1");            // escape white space
      break;
    case Date:
      try{
        return query.toISOString();
      } catch(e){
        return;
      }
      break;
    default:
      // TODO: this is safe, right? you can't send some crazy non-string
      // thing in and make it evaluate to an unsafe string, right?
      return query;
      break;
    }
  }

  function escapeBound(bound){
    // "*" means unbounded and we don't want to escape it
    if (bound === "*") return bound;

    // 0 would be evaluated as false but it's a valid bound
    if (bound === 0) return bound;

    // we'll interpret undefined or null as effectively unbounded,
    // which is useful for dates because "*" will be evaluated as an
    // invalid date
    if (bound === null || typeof(bound) === "undefined") return "*";

    // otherwise escape the bound
    return escapeQuery(bound);
  }

  function rangeQuery(propertyName, from, to){
    return [
      fieldName(propertyName),
      [ "[", escapeBound(from), " TO ", escapeBound(to), "]" ].join("")
    ].join(":");
  }

  function orQuery(propertyName, values){
    if (values.constructor !== Array) values = [];

    return "(" + values.map(function(property){
      return formatQuery(propertyName, property);
    }).join(" OR ") + ")";
  }

  function andQuery(propertyName, values){
    if (values.constructor !== Array) values = [];

    return "(" + values.map(function(property){
      return formatQuery(propertyName, property);
    }).join(" AND ") + ")";
  }

  function likeQuery(propertyName, substring){
    // I imagine there are some RegExp strings that would cause big
    // problems. I'm not solving for that here.
    return [
      propertyName,
      new RegExp([ "\.*", escapeRegExp(escapeQuery(substring)), "\.*"].join("")).toString()
    ].join(":");
  }

  function notLikeQuery(propertyName, substring){
    console.log("not like query not implemented in the loopback riak connector");
  }

  function notEqualQuery(propertyName, value){
    return [ "-", formatQuery(propertyName, value) ].join("");
  }
}
