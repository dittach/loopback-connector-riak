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
  return db;
};

global.prepareDatabaseForTests = function(callback){
  var db = getSchema();
  var yz = db.connector.db.yokozuna;

  console.log("creating a 'model' index for use in testing...");

  yz.createIndex("model", "_yz_default", function(){
    // give some time for the index to actually be created
    setTimeout(function(){
      console.log("associating the 'model' index with the 'Model' bucket...");

      yz.associateIndexWithBucket("model", "Model", function(){
        callback();
      });
    }, 3000);
  });
}
