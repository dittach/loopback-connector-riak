var sinon        = require('sinon');
var loopbackRiak = require('../../lib/riak');
var assert       = require('assert');

describe("api/updateAttributes", function(){
  var findStub, saveStub;
  var datasource = { settings: {} };
  var modelName = "TestModel";

  var updateData = {
    fresh: "data"
  };

  var id = "gobsmacked";

  beforeEach(function(){
    loopbackRiak.initialize(datasource);

    findStub = sinon.stub(datasource.connector, "find");
    saveStub = sinon.stub(datasource.connector.db, "save");
  });

  afterEach(function(){
    findStub.restore();
    saveStub.restore();
  });

  describe("if the document exists", function(){
    it("it saves the document with the update data", function(done){
      datasource.connector.updateAttributes(modelName, id, updateData, function(error, document){
        var saveArgs = saveStub.lastCall.args;

        assert.ok(document.fresh);
        assert.equal(saveArgs[0], modelName);
        assert.equal(saveArgs[1], id);
        assert.equal(saveArgs[2].fresh, updateData.fresh);

        done();
      });

      findStub.yieldsAsync(null, {});
      saveStub.yieldsAsync(null, true);
    });
  });

  describe("if the document doesn't exist", function(){
    it("returns emptiness", function(done){
      datasource.connector.updateAttributes(modelName, id, updateData, function(error, document){
        assert.ok(!error);
        assert.ok(!document);

        done();
      });

      findStub.yieldsAsync(null, null);
    });
  });
});
