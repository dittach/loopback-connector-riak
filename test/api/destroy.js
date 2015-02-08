var sinon            = require('sinon');
var loopbackRiak     = require('../../lib/riak');
var assert           = require('assert');

describe("api/destroy", function(){
  var removeStub;
  var modelName  = "TestModel";
  var datasource = { settings: {} };

  beforeEach(function(){
    loopbackRiak.initialize(datasource);

    removeStub = sinon.stub(datasource.connector.db, "remove");
    removeStub.yieldsAsync(null, true);
  });

  afterEach(function(){
    removeStub.restore();
  });

  describe("with a conflicting id", function(){
    var id = "key_to_destroy";

    it("calls remove with the bucket name and id", function(done){
      datasource.connector.destroy(modelName, id, function(error, destroyed){
        var removeArgs = removeStub.lastCall.args;

        assert.equal(removeArgs[0], modelName);
        assert.equal(removeArgs[1], id);

        done();
      });
    });
  });
});
