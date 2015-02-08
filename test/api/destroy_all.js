var sinon        = require('sinon');
var loopbackRiak = require('../../lib/riak');
var assert       = require('assert');

describe("api/destroyAll", function(){
  var datasource = { settings: {} };
  var modelName = "TestModel";

  beforeEach(function(){
    loopbackRiak.initialize(datasource);
  });

  describe("if the bucket exists", function(){
    var bucketStub, destroyStub;

    beforeEach(function(){
      datasource.connector.db = {
        buckets: function(meta, callback){
          callback(null, [ modelName ]);
        }
      };

      destroyStub = sinon.stub(datasource.connector, "destroy");
    });

    afterEach(function(){
      delete(datasource.connector.db);
      destroyStub.restore();
    });

    describe("and the 'where' contains only IDs", function(){
      var ids;
      var anticipatedResults = [];
      var destroyStubs = [];

      beforeEach(function(){
        ids = [1,2,3].map(function(element, index){
          return [ "key", index ].join("");
        });

        var result, stub;
        ids.forEach(function(id, index){
          result = [ "result", index ].join("");
          anticipatedResults.push(result);

          stub = destroyStub.withArgs(modelName, id, sinon.match.func);
          destroyStubs.push(stub);
        });
      });

      it("maps the IDs to destroy", function(done){
        datasource.connector.destroyAll(modelName, { id: ids }, function(error, results){
          assert.equal(destroyStub.callCount, ids.length);

          ids.forEach(function(id, index){
            assert.ok(destroyStub.calledWith(modelName, id, sinon.match.func));

            assert.equal(results[index], anticipatedResults[index]);
          });

          done();
        });

        destroyStubs.forEach(function(stub, index){
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

      it("kicks off a search and maps the results to destroy", function(done){
        datasource.connector.destroyAll(modelName, where, function(error, results){
          assert.ok(searchAndMapResultsStub.calledWith(modelName, sinon.match.any, destroyStub, sinon.match.func));
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
      datasource.connector.destroyAll(modelName, {}, function(error, results){
        assert.equal(results.constructor, Array);
        assert.equal(results.length, 0);

        done();
      });
    });
  });
});
