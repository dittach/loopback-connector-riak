var sinon        = require('sinon');
var loopbackRiak = require('../../lib/riak');
var assert       = require('assert');

describe("api/updateOrCreate", function(){
  var updateStub, createStub;
  var datasource = { settings: {} };
  var modelName = "TestModel";

  var updateData = {
    id:    "gobsmacked",
    fresh: "data"
  };

  beforeEach(function(){
    loopbackRiak.initialize(datasource);

    updateStub = sinon.stub(datasource.connector, "updateAttributes");
    createStub = sinon.stub(datasource.connector, "create");
  });

  afterEach(function(){
    updateStub.restore();
    createStub.restore();
  });

  describe("if the document exists", function(){
    it("it saves the document with the update data", function(done){
      datasource.connector.updateOrCreate(modelName, updateData, function(error, document){
        var updateArgs = updateStub.lastCall.args;

        assert.equal(updateArgs[0], modelName);
        assert.equal(updateArgs[1], updateData.id);
        assert.equal(updateArgs[2], updateData);
        assert.equal(document.fresh, updateData.fresh);

        done();
      });

      updateStub.yieldsAsync(null, updateData);
    });
  });

  describe("if the document doesn't exist", function(){
    it("creates the document", function(done){
      datasource.connector.updateOrCreate(modelName, updateData, function(error, document){
        var createArgs = createStub.lastCall.args;

        assert.equal(createArgs[0], modelName);
        assert.equal(createArgs[1], updateData);
        assert.equal(document.fresh, updateData.fresh);

        done();
      });

      updateStub.yieldsAsync(null, null);
      createStub.yieldsAsync(null, updateData);
    });
  });
});
