describe('mysql imported features', function () {

  before(function(done) {
    require('./init.js');

    prepareDatabaseForTests(done);
  });

  require('loopback-datasource-juggler/test/common.batch.js');
  require('loopback-datasource-juggler/test/include.test.js');
});
