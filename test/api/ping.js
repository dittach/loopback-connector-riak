var assert = require('assert');
var sinon = require('sinon');
var loopbackRiak = require('../../lib/riak');

describe("api/ping", function(){
  var pingStub;
  var datasource = { settings: {} };

  beforeEach(function(){
    loopbackRiak.initialize(datasource);

    pingStub = sinon.stub(datasource.connector.db, "ping");
  });

  afterEach(function(){
    pingStub.restore();
  });

  it("passes the callback to ping", function(done){
    var callback = function(){};

    datasource.connector.ping(callback);

    var args = pingStub.lastCall.args;

    assert.equal(args.length, 1);
    assert.equal(args[0], callback);

    done();
  });
});
