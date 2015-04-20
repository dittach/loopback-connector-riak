var async = require('async');
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

  return db;
};

var prepareBucketForSearching = function(db, bucketName, callback){
  var indexName = bucketName.toLowerCase();
  var yz = db.connector.db.yokozuna;

  var schemaXML = fs.readFileSync("./test/schemas/" + indexName + ".xml").toString('utf8');

  console.log("creating '", indexName, "' solr/yz schema...");

  // :( :( this is definitely not fun. basically because yokozuna is
  // solr and solr is lucene, the interactions between riak and solr
  // take indeterminate amounts of time and we have to basically give
  // plennntttty of time for them to get in sync when we make changes
  yz.createSchema(indexName, schemaXML, function(){
    console.log("destroying '", indexName, "' index...");
    yz.disassociateIndexFromBucket(bucketName, function(){
      setTimeout(function(){
        yz.destroyIndex(indexName, function(){
          setTimeout(function(){
            console.log("creating '", indexName, "' index...");

            yz.createIndex(indexName, indexName, function(){
              setTimeout(function(){
                console.log("associating the '", indexName, "' index with the '", bucketName, "' bucket...");

                yz.associateIndexWithBucket(indexName, bucketName, function(){
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

  async.each([ "Model", "User" ], function(bucketName, callback){
    prepareBucketForSearching(db, bucketName, callback);
  }, prepareCallback);
}
