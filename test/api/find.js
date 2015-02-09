var sinon        = require('sinon');
var loopbackRiak = require('../../lib/riak');
var assert       = require('assert');

describe("api/find", function(){
  var getStub, errorSpy;
  var anticipatedResult = {
    plaything: "stick",
    playmate: "puppy",
    someDate: new Date()
  };

  var jsonResult = JSON.parse(JSON.stringify(anticipatedResult));

  var datasource = { settings: {} };
  var models = {
    BlackCat: {
      properties: {
        plaything: {
          type: String
        },

        playmate: {
          type: String
        },

        someDate: {
          type: Date
        }
      }
    }
  };

  var modelName = Object.keys(models)[0];

  beforeEach(function(){
    loopbackRiak.initialize(datasource);
    datasource.connector._models = models;

    getStub = sinon.stub(datasource.connector.db, "get");

    errorSpy = sinon.spy();

    getStub.yieldsAsync(errorSpy, jsonResult);
  });

  afterEach(function(){
    getStub.restore();
  });

  it("calls find with the model name and id", function(done){
    var id = "some id";

    datasource.connector.find(modelName, id, function(error, result){
      var getArgs = getStub.lastCall.args;

      assert.equal(getArgs[0], modelName);
      assert.equal(getArgs[1], id);

      done();
    });
  });

  it("returns the document as native types", function(done){
    var id = "some id";

    datasource.connector.find(modelName, id, function(error, result){
      assert.equal(error, errorSpy);
      assert.equal(anticipatedResult.foo, result.foo);
      assert.equal(anticipatedResult.that, result.that);

      assert.equal(anticipatedResult.someDate.constructor, Date);

      done();
    });
  });
});
