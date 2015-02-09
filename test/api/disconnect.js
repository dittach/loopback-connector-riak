var sinon        = require('sinon');
var loopbackRiak = require('../../lib/riak');
var assert       = require('assert');

describe("api/disconnect", function(){
  var datasource = { settings: {} };

  beforeEach(function(){
    loopbackRiak.initialize(datasource);
  });

  it("removes the db reference", function(done){
    datasource.connector.disconnect(function(){
      assert.ok(!datasource.connector.db);

      done();
    });
  });
});
