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
module.exports = function(riak, bucketName, query){
  var modelName = bucketNameComposer.decompose(riak, bucketName);
  var properties = riak._models[modelName] && riak._models[modelName].properties;
  if (!properties) return;

  var queries = query.where || query;

  if (queries.constructor !== Array) queries = [ queries ];

  return queries.map(function(query){
    return componentizeFacets(query).join(" AND ");
  }).join(" AND ");

  console.log(out);

  return out;

  /* helpers */

  function hasProperty(propertyName){
    return !!properties[propertyName];
  }

  function componentizeFacets(query){
    var facetComponents = [];
    var notQuery;

    for (var propertyName in query){
      // support top-level and/or facets with sub-queries
      if (["and", "or"].indexOf(propertyName.toLowerCase()) !== -1){
        facetComponents.push(
          componentizeAndOr(propertyName, query[propertyName])
        );

        continue;
      }

      // save this for the end
      if (propertyName.toLowerCase() === "not"){
        notQuery = query[propertyName];
        continue;
      }

      if (hasProperty(propertyName)){
        facetComponents.push(
          componentizeFacet(propertyName, query[propertyName])
        );
      }

    };

    if (notQuery){
      facetComponents.push(
        componentizeNot(notQuery)
      );
    }

    return facetComponents;
  }

  function componentizeAndOr(andOr, query){
    var joiner = [" ", andOr.toUpperCase(), " "].join("");

    var componentized = query.map(function(subquery){
      return componentizeFacets(subquery).join(joiner);
    }).join(joiner)

    if (query.length === 1) return componentized;

    return ["(", componentized, ")"].join("");
  }

  function componentizeNot(query){
    if (!Array.isArray(query)) query = [ query ];

    var componentized = query.map(function(subquery){
      return componentizeFacets(subquery).join(" AND ");
    }).join(" AND ")

    return ["NOT (", componentized, ")"].join("");
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

    // supporting Strongloop's crazy 'where: { order: { "gt": null }'
    // and 'where: { order: { "lt": null }' test assertions that
    // basically, according to them, all mean empty
    if (query === null) return isEmptyQuery(propertyName);

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
    case "gt":
      // example: price:{10 TO *}
      return rangeQuery(propertyName, query, "*", false);
      break;
    case "lt":
      // example: price:{10 TO *}
      return rangeQuery(propertyName, "*", query, false);
      break;
    case "gte":
      // example: price:[10 TO *]
      return rangeQuery(propertyName, query, "*", true);
      break;
    case "lte":
      // example: price:[* TO 10]
      return rangeQuery(propertyName, "*", query, true);
      break;
    case "between":
      // example: price:[1 TO 10]
      return rangeQuery(propertyName, query[0], query[1]);
      break;
    case "inq":
      return orQuery(propertyName, query);
      break;
    case "nin":
      return notInQuery(propertyName, query);
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
    if (query === "*") return query;

    switch(query.constructor){
    case String:
      return query.replace(SOLR_ESCAPE_REGEXP, "\\$1"). // escape Solr query characters
             replace(/(\s)/gi, "\\$1");                 // escape white space
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
    var escaped = escapeQuery(bound);

    if (escaped.constructor !== String) return escaped;

    // bound strings need to be quoted
    return ['"', escaped, '"'].join("");
  }

  function rangeQuery(propertyName, from, to, inclusive){
    var brackets = inclusive ? [ "[", "]" ] : [ "{", "}" ];

    return [
      fieldName(propertyName),
      [ brackets[0], escapeBound(from), " TO ", escapeBound(to), brackets[1] ].join("")
    ].join(":");
  }

  function notInQuery(propertyName, values){
    if (values.constructor !== Array) values = [];

    return "(" + values.map(function(value){
      return [ "(*:* NOT", formatQuery(propertyName, value), ")" ].join(" ")
    }).join(" AND ") + ")";
  }

  function orQuery(propertyName, values){
    return logicQuery(propertyName, values, "OR");
  }

  function andQuery(propertyName, values){
    return logicQuery(propertyName, values, "AND");
  }

  function logicQuery(propertyName, values, logic){
    if (values.constructor !== Array) values = [];

    logic = logic || "AND";

    var joiner = [ " ", logic, " " ].join("");

    return "(" + values.map(function(value){
      return formatQuery(propertyName, value);
    }).join(joiner) + ")";
  }

  function likeQuery(propertyName, substring){
    // I imagine there are some RegExp strings that would cause big
    // problems. I'm not solving for that here.
    return [
      propertyName,
      new RegExp(substring).toString()
    ].join(":");
  }

  function notLikeQuery(propertyName, substring){
    console.log("not like query not implemented in the loopback riak connector");
  }

  function notEqualQuery(propertyName, value){
    return [ "-", formatQuery(propertyName, value) ].join("");
  }

  function isEmptyQuery(propertyName){
    return ["-", propertyName, ":", "[* TO *]"].join("");
  }


  // The addition of the not in the  query !
  function componentizeNotQuery (notQueries) {

    var componentizedNot = [];
    if (notQueries.constructor !== Array) {
      for (var propertyName in notQueries){
        componentizedNot.push(componentizeFacet(propertyName, notQueries[propertyName]))
      }
    } else {
      notQueries.forEach(function (element, index) {
        for (var propertyName in element){
          componentizedNot.push(componentizeFacet(propertyName, element[propertyName]))
        }

      });
    }
    return componentizedNot;
  }

}
