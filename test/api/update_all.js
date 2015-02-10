var sinon        = require('sinon');
var loopbackRiak = require('../../lib/riak');
var assert       = require('assert');

describe("api/updateAll", function(){
  var datasource = { settings: {} };
  var modelName = "TestModel";
  var updateData = {};

  beforeEach(function(){
    loopbackRiak.initialize(datasource);
  });

  describe("if the bucket exists", function(){
    var bucketStub, updateStub;

    beforeEach(function(){
      datasource.connector.db = {
        buckets: function(meta, callback){
          callback(null, [ modelName ]);
        }
      };

      updateStub = sinon.stub(datasource.connector, "updateAttributes");
    });

    afterEach(function(){
      delete(datasource.connector.db);
      updateStub.restore();
    });

    describe("and the 'where' contains only IDs", function(){
      var ids;
      var anticipatedResults = [];
      var updateStubs = [];

      beforeEach(function(){
        ids = [1,2,3].map(function(element, index){
          return [ "key", index ].join("");
        });

        var result, stub;
        ids.forEach(function(id, index){
          result = [ "result", index ].join("");
          anticipatedResults.push(result);

          stub = updateStub.withArgs(modelName, id, updateData, sinon.match.func);
          updateStubs.push(stub);
        });
      });

      it("maps the IDs to updateAttributes", function(done){
        datasource.connector.updateAll(modelName, { id: ids }, updateData, function(error, results){
          assert.equal(updateStub.callCount, ids.length);

          ids.forEach(function(id, index){
            assert.ok(updateStub.calledWith(modelName, id, updateData, sinon.match.func));

            assert.equal(results[index], anticipatedResults[index]);
          });

          done();
        });

        updateStubs.forEach(function(stub, index){
          stub.yieldsAsync(null, anticipatedResults[index]);
        });
      });
    });

    describe("and the 'where' contains more than an ID", function(){
      var searchAndMapResultsStub;
      var anticipatedResults = [ "john", "yoko", "zuna" ];
      var where = {
        cats: {
          dogs: "living together"
        }
      };

      beforeEach(function(){
        searchAndMapResultsStub = sinon.stub(datasource.connector, "searchAndMapResults");
      });

      afterEach(function(){
        searchAndMapResultsStub.restore();
      });

      it("kicks off a search and maps the results to updateAttributes", function(done){
        datasource.connector.updateAll(modelName, where, updateData, function(error, results){
          assert.ok(searchAndMapResultsStub.calledWith(modelName, sinon.match.any, sinon.match.func, sinon.match.func));
          assert.equal(searchAndMapResultsStub.lastCall.args[1].where, where);

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
      datasource.connector.updateAll(modelName, {}, updateData, function(error, results){
        assert.equal(results.constructor, Array);
        assert.equal(results.length, 0);

        done();
      });
    });
  });
});
