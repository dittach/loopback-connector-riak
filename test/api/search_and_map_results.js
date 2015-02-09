var assert = require('assert');
var sinon = require('sinon');
var loopbackRiak = require('../../lib/riak');

describe("api/searchAndMapResults", function(){
  var searchStub, mapIteratorStub;
  var modelName = "TestModel";
  var datasource = { settings: {} };

  var conditions = {
    where: {
      who: "what",
      when: "why"
    }
  };

  beforeEach(function(){
    loopbackRiak.initialize(datasource);

    searchStub = sinon.stub(datasource.connector, "search");
    mapIteratorStub = sinon.stub();
  });

  afterEach(function(){
    searchStub.restore();
  });

  it("initiates a search in the bucket with provided conditions", function(done){
    datasource.connector.searchAndMapResults(modelName, conditions, mapIteratorStub, function(error, results){
      var searchArgs = searchStub.lastCall.args;

      assert.equal(searchArgs[0], modelName);
      assert.equal(searchArgs[1], conditions);

      done();
    });

    searchStub.yieldsAsync(null, {});
  });

  describe("with an error", function(){
    it("throws the error", function(done){
      var anticipatedError = "whoa";

      datasource.connector.searchAndMapResults(modelName, conditions, mapIteratorStub, function(error, results){
        assert.equal(error, anticipatedError);

        done();
      });

      searchStub.yieldsAsync(anticipatedError);
    });
  });

  describe("with no error", function(){
    it("passes each result to the passed-in map iterator function", function(done){
      var anticipatedResults = {
        foo: {},
        bar: {},
        baz: {}
      };

      datasource.connector.searchAndMapResults(modelName, conditions, mapIteratorStub, function(error, results){
        var callArgs, callNum = 0;

        Object.keys(anticipatedResults).forEach(function(id){
          callArgs = mapIteratorStub.getCall(callNum).args;

          assert.equal(callArgs[0], modelName);
          assert.equal(callArgs[1], id);

          callNum++;
        });

        done();
      });

      searchStub.yieldsAsync(null, anticipatedResults);
      mapIteratorStub.yieldsToAsync(null, {});
    });
  });
});
