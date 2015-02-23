var sinon            = require('sinon');
var loopbackRiak     = require('../../lib/riak');
var assert           = require('assert');

describe("api/create", function(){
  var existsStub, saveStub;
  var modelName  = "TestModel";
  var datasource = { settings: {} };

  beforeEach(function(){
    loopbackRiak.initialize(datasource);

    existsStub = sinon.stub(datasource.connector.db, "exists");
    saveStub   = sinon.stub(datasource.connector.db, "save");
  });

  afterEach(function(){
    existsStub.restore();
    saveStub.restore();
  });

  describe("with a conflicting id", function(){
    var loggerStub;

    beforeEach(function(){
      loggerSpy = sinon.spy(datasource.connector, "_logger");
    });

    afterEach(function(){
      loggerSpy.restore();
    });

    it("throws an error", function(done){
      var data = { id: "conflict" };

      datasource.connector.create(modelName, data, function(error, id){
        var loggerArgs = loggerSpy.lastCall.args;

        assert.ok(loggerArgs[0]);

        done();
      });

      existsStub.yieldsAsync(null, true);
    });
  });

  describe("with no conficting id", function(){
    it("saves the data with the specified id", function(done){
      var data = { id: "noconflict" };

      datasource.connector.create(modelName, data, function(error, id){
        var saveArgs = saveStub.lastCall.args;

        assert.equal(data.id, id);
        assert.equal(saveArgs[0], modelName);
        assert.equal(saveArgs[1], data.id);

        done();
      });

      existsStub.yieldsAsync(null, false);
      saveStub.yieldsAsync(null, true);
    });

    it("generates an id if none is specified", function(done){
      var data = { some: "data" };

      datasource.connector.create(modelName, data, function(error, id){
        assert.ok(id);

        done();
      });

      existsStub.yieldsAsync(null, false);
      saveStub.yieldsAsync(null, true);
    });
  });
});
