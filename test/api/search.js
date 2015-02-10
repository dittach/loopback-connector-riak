var assert = require('assert');
var sinon = require('sinon');
var loopbackRiak = require('../../lib/riak');

describe("api/search", function(){
  var yokozunaStub;
  var modelName = "TestModel";
  var datasource = { settings: {} };

  var conditions = {
    where: {
      who: "what",
      when: "why"
    }
  };

  var anticipatedDocs = [ { _yz_rk: "foo" }, { _yz_rk: "bar" }, { _yz_rk: "baz" } ];

  beforeEach(function(){
    loopbackRiak.initialize(datasource);
    yokozunaStub = sinon.stub(datasource.connector.db.yokozuna, "find");
  });

  afterEach(function(){
    yokozunaStub.restore();
  });

  describe("when RiakJS throws an error", function(){
    beforeEach(function(){
      yokozunaStub.yieldsAsync("we lost all the schnozzbarkus while performing the search");
    });

    it("returns an error", function(done){
      datasource.connector.search(modelName, conditions, function(error, docs){
        assert.ok(error);
        assert.ok(!docs);

        done();
      });
    });
  });

  describe("when riak returns a non-2xx response", function(){
    beforeEach(function(){
      yokozunaStub.yieldsAsync(null, {}, { statusCode: 418 });
    });

    it("returns an error", function(done){
      datasource.connector.search(modelName, conditions, function(error, docs){
        assert.ok(error);
        assert.ok(!docs);

        done();
      });
    })
  });

  describe("when solr returns something that doesn't look like a result set", function(){
    beforeEach(function(){
      yokozunaStub.yieldsAsync(null, { status: 500 }, {});
    });

    it("returns an error", function(done){
      datasource.connector.search(modelName, conditions, function(error, docs){
        assert.ok(error);
        assert.ok(!docs);

        done();
      });
    })
  });

  describe("with solr results", function(){
    beforeEach(function(){
      yokozunaStub.yieldsAsync(null, { status: 200, docs: anticipatedDocs }, { statusCode: 200 });
    });

    it("returns the results indexed by riak key", function(done){
      datasource.connector.search(modelName, conditions, function(error, docs){
        assert.ok(!error);

        assert.equal(docs.foo, anticipatedDocs[0]);
        assert.equal(docs.bar, anticipatedDocs[1]);
        assert.equal(docs.baz, anticipatedDocs[2]);

        done();
      });
    });
  });
});
