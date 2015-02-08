var sinon        = require('sinon');
var loopbackRiak = require('../../lib/riak');
var assert       = require('assert');

describe("api/all", function(){
  var datasource = { settings: {} };
  var modelName = "TestModel";

  beforeEach(function(){
    loopbackRiak.initialize(datasource);
  });

  describe("if the bucket exists", function(){
    var bucketStub, findStub;

    beforeEach(function(){
      datasource.connector.db = {
        buckets: function(meta, callback){
          callback(null, [ modelName ]);
        }
      };

      findStub = sinon.stub(datasource.connector, "find");
    });

    afterEach(function(){
      delete(datasource.connector.db);
      findStub.restore();
    });

    describe("and the conditions contain only IDs", function(){
      var ids;
      var anticipatedResults = [];
      var findStubs = [];

      beforeEach(function(){
        ids = [1,2,3].map(function(element, index){
          return [ "key", index ].join("");
        });

        var result, stub;
        ids.forEach(function(id, index){
          result = [ "result", index ].join("");
          anticipatedResults.push(result);

          stub = findStub.withArgs(modelName, id, sinon.match.func);
          findStubs.push(stub);
        });
      });

      it("maps the IDs to find", function(done){
        datasource.connector.all(modelName, { where: { id: ids } }, function(error, results){
          assert.equal(findStub.callCount, ids.length);

          ids.forEach(function(id, index){
            assert.ok(findStub.calledWith(modelName, id, sinon.match.func));

            assert.equal(results[index], anticipatedResults[index]);
          });

          done();
        });

        findStubs.forEach(function(stub, index){
          stub.yieldsAsync(null, anticipatedResults[index]);
        });
      });
    });

    describe("and the conditions contain more than an ID", function(){
      var searchAndMapResultsStub;
      var anticipatedResults = [ "john", "yoko", "zuna" ];
      var conditions = {
        where: {
          cats: {
            dogs: "living together"
          }
        }
      };

      beforeEach(function(){
        searchAndMapResultsStub = sinon.stub(datasource.connector, "searchAndMapResults");
      });

      afterEach(function(){
        searchAndMapResultsStub.restore();
      });

      it("kicks off a search and maps the results to find", function(done){
        datasource.connector.all(modelName, conditions, function(error, results){
          assert.ok(searchAndMapResultsStub.calledWith(modelName, conditions, findStub, sinon.match.func));

          assert.equal(results, anticipatedResults);

          done();
        });

        searchAndMapResultsStub.callsArgWith(3, null, anticipatedResults);
      });
    });
  });

  describe("if the bucket doesn't exist", function(){
    beforeEach(function(){
      datasource.connector.db = {
        buckets: function(meta, callback){
          callback(null, []);
        }
      };
    });

    afterEach(function(){
      delete(datasource.connector.db);
    });

    it("returns an empty result set", function(done){
      datasource.connector.all(modelName, {}, function(error, results){
        assert.equal(results.constructor, Array);
        assert.equal(results.length, 0);

        done();
      });
    });
  });
});
