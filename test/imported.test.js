describe('mysql imported features', function () {

  before(function(done) {
    require('./init.js');

    prepareDatabaseForTests(function(){
      console.log("running the actual tests now...");
      done();
    });
  });

  require('loopback-datasource-juggler/test/datatype.test.js');
  require('loopback-datasource-juggler/test/basic-querying.test.js');
  require('loopback-datasource-juggler/test/hooks.test.js');
  require('loopback-datasource-juggler/test/include.test.js');
});
