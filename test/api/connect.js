var sinon            = require('sinon');
var loopbackRiak     = require('../../lib/riak');
var assert           = require('assert');
var RiakJSHttpClient = require('riak-js')({}).constructor;

describe("api/connect", function(){
  var datasource = { settings: {} };
  var pingError = sinon.spy();
  var pingStub;

  beforeEach(function(done){
    loopbackRiak.initialize(datasource);

    pingStub = sinon.stub(datasource.connector, "ping");
    pingStub.yieldsAsync(pingError, true);

    done();
  });

  afterEach(function(){
    pingStub.restore();
  });

  it("calls ping, which yields the ping error and the db", function(done){
    datasource.connector.connect(function(error, db){
      assert.equal(error, pingError);
      assert.equal(db.constructor, RiakJSHttpClient);

      done();
    });
  });

  describe("when the connection", function(){
    var loggerSpy;

    beforeEach(function(){
      loggerSpy = sinon.stub(datasource.connector, "_logger");
    });

    describe("succeeds", function(){
      beforeEach(function(done){
        pingStub.yieldsAsync(null, true);

        done();
      });

      it("logs a success message", function(done){
        datasource.connector.connect(function(error, db){
          assert.equal(loggerSpy.lastCall.args[0], "connection is established to host:");

          done();
        });
      });
    });

    describe("fails", function(){
      it("logs a success message", function(done){
        datasource.connector.connect(function(error, db){
          assert.equal(loggerSpy.lastCall.args[0], "connection failed:");

          done();
        });
      });
    });
  });
});
