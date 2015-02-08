var sinon            = require('sinon');
var loopbackRiak     = require('../../lib/riak');
var assert           = require('assert');

describe("api/count", function(){
  var datasource = { settings: {} };

  var models = {
    BlackCat: {
      properties: {
        plaything: {
          Type: String
        },

        playmate: {
          Type: String
        }
      }
    }
  };

  var modelName = Object.keys(models)[0];
  var numberOfResults, yokozunaStub, errorSpy;

  beforeEach(function(){
    loopbackRiak.initialize(datasource);
    datasource.connector._models = models;

    anticipatedNumberOfResults = Math.ceil(Math.random(10) * 10);

    yokozunaStub = sinon.stub(datasource.connector.db.yokozuna, "find");
    yokozunaStub.yieldsAsync( null, { numFound: anticipatedNumberOfResults } );
  });

  it("searches a yokozuna index named after the snake case bucket name", function(done){
    datasource.connector.count(modelName, function(error, numberFound){
      var args = yokozunaStub.lastCall.args;
      assert.equal(args[0], "black_cat");

      done();
    });
  });

  it("searches with a solr query version of the provided conditions", function(done){
    datasource.connector.count(modelName, function(error, numberFound){
      var args = yokozunaStub.lastCall.args;
      assert.equal(args[1], "plaything:taco AND playmate:orangutan");

      done();
    }, { plaything: "taco", playmate: "orangutan" });
  });

  it("yields the number found by yokozuna", function(done){
    datasource.connector.count(modelName, function(error, numberFound){
      assert.equal(anticipatedNumberOfResults, numberFound);

      done();
    });
  });

  describe("with an error", function(){
    beforeEach(function(){
      errorSpy = sinon.spy();

      yokozunaStub.yieldsAsync( errorSpy, { numFound: anticipatedNumberOfResults } );
    });

    it("yields the error", function(done){
      datasource.connector.count(modelName, function(error, numberFound){
        assert.equal(errorSpy, error);

        done();
      });
    });
  });
});
