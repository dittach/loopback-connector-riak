var assert = require('assert');
var sinon = require('sinon');
var loopbackRiak = require('../../lib/riak');

describe("api/save", function(){
  var saveStub;
  var modelName = "TestModel";
  var datasource = { settings: {} };

  beforeEach(function(){
    loopbackRiak.initialize(datasource);

    saveStub = sinon.stub(datasource.connector.db, "save");
    saveStub.yieldsAsync(null, true);
  });

  afterEach(function(){
    saveStub.restore();
  });

  describe("without an id", function(){
    it("throws an error", function(done){
      var doc = { wow: "bbq" };

      datasource.connector.save(modelName, doc, function(error, result){
        assert.ok(error);
        assert.ok(!saveStub.lastCall);

        done();
      });
    });
  });

  describe("with an id", function(){
    it("calls save with the document", function(done){
      var doc = { id: "cucumber", wow: "bbq" };

      datasource.connector.save(modelName, doc, function(error, result){
        var saveArgs = saveStub.lastCall.args;

        assert.equal(saveArgs[0], modelName);
        assert.equal(saveArgs[1], doc.id);
        assert.equal(saveArgs[2], doc);

        done();
      });
    });
  });
});
