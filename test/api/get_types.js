var assert = require('assert');
var loopbackRiak = require('../../lib/riak');

describe("api/getTypes", function(){
  var datasource = { settings: {} };

  beforeEach(function(){
    loopbackRiak.initialize(datasource);
  });

  it("returns types", function(done){
    var types = datasource.connector.getTypes();

    assert.notEqual(types.indexOf("db"),    -1);
    assert.notEqual(types.indexOf("nosql"), -1);
    assert.notEqual(types.indexOf("riak"),  -1);

    done();
  });
});
