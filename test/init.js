var async = require('neo-async');
var fs = require('fs');

module.exports = require('should');

var DataSource = require('loopback-datasource-juggler').DataSource;
var config = require('rc')('loopback', {test: {riak: {}}}).test.riak;

global.getConfig = function (options) {
  var dbConf = {
    host: 'localhost',
    port: 8098
  };

  if (options) {
    for (var el in options) {
      dbConf[el] = options[el];
    }
  }

  return dbConf;
};

global.getDataSource = global.getSchema = function (options) {
  var db = new DataSource(require('../'), getConfig(options));

  var originalSearch = db.connector.search;
  db.connector.search = function(){
    var args = arguments;

    setTimeout(function(){
      originalSearch.apply(db.connector, args);
    }, 8000); // yes, this makes the tests ridiculously slow
  }

  var originalCount = db.connector.count;
  db.connector.count = function(){
    var args = arguments;

    setTimeout(function(){
      originalCount.apply(db.connector, args);
    }, 8000); // yes, this makes the tests ridiculously slow
  }

  return db;
};

var camelCaseToSnakeCase = function(str){
  return str.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();}).replace(/^_/, "");
}

var prepareBucketForSearching = function(db, bucketName, callback){
  var indexName = camelCaseToSnakeCase(bucketName);
  var yz = db.adapter.db;

  var schemaXML = fs.readFileSync("./test/schemas/" + indexName + ".xml").toString('utf8');

  console.log("creating '", indexName, "' solr/yz schema...");

  // :( :( this is definitely not fun. basically because yokozuna is
  // solr and solr is lucene, the interactions between riak and solr
  // take indeterminate amounts of time and we have to basically give
  // plennntttty of time for them to get in sync when we make changes
  yz.storeSchema({
    schemaName: indexName,
    schema:     schemaXML
  }, function(){
    console.log("destroying '", indexName, "' index...");
    yz.storeBucketProps({
      bucket:    bucketName,
      searchIndex: "__dont_index__"
    }, function(){
      setTimeout(function(){
        yz.deleteIndex({
          indexName: indexName
        }, function(){
          setTimeout(function(){
            console.log("creating '", indexName, "' index...");

            yz.storeIndex({
              indexName:  indexName,
              schemaName: indexName
            }, function(){
              setTimeout(function(){
                console.log("associating the '", indexName, "' index with the '", bucketName, "' bucket...");

                yz.storeBucketProps({
                  bucket:    bucketName,
                  searchIndex: indexName
                }, function(){
                  setTimeout(function(){
                    callback();
                  }, 5000);
                });
              }, 10000); // creating an index takes an especially long time
            });
          }, 5000);
        });
      }, 5000);
    });
  });
}

global.prepareDatabaseForTests = function(prepareCallback){
  var db = getSchema();

  async.each([
    "Model",
    "User",
    "Person",
    "Book",
    "Chapter",
    "Author",
    "Reader",
    "Physician",
    "Patient",
    "Appointment",
    "Address",
    "Category",
    "Picture",
    "PictureLink",
    "Item",
    "Passport",
    "Supplier",
    "Article",
    "TagName",
    "Job",
    "List",
    "Account",
    "ArticleTagName",
    "Post",
    "AccessToken",
    "Assembly",
    "AssemblyPart",
    "Part"
  ], function(bucketName, callback){
    prepareBucketForSearching(db, bucketName, callback);
  }, prepareCallback);
}
