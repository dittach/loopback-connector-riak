// this module allows for descending into solr and retrieving an
// unlimited number of keys (solr normally either returns 10 results
// or a fixed number you provide)
//
// WARNING: anything with 'all keys' is probably never something you
//          actually want to do with Riak but for compatibility we'll
//          make it possible. enjoy.
var extend = require('util')._extend;

// 1000 because humans irrationally like round numbers
var batchSize = 1000;

module.exports = function(riak){
  return function(bucketName, conditions, apiCallback){
    var batch = 0;
    var keys  = [];
    var ids;

    fetchKeysForBatch();

    // we'll pull down ids in serial batches of 1000 and just keep
    // going until there are no more results. this could definitely be
    // made faster by doing batches in parallel but if you're doing an
    // *all operation you get what you pay for amirite? also I know
    // the data can change between searches. wanna fight about it?
    function fetchKeysForBatch(){
      riak.search(bucketName, extend({
        limit: batchSize,
        skip:  batch * batchSize
      }, conditions), function(error, docsById){
        if (error) return apiCallback(error);

        ids = Object.keys(docsById);

        // hope you can fit your keys in memory. YOLO. some day maybe
        // we'll make this do operations in batches rather than load
        // the whole key set ;)
        keys.push.apply(keys, ids);
        if (ids.length < batchSize) return apiCallback(null, keys);

        batch++;
        fetchKeysForBatch();
      });
    }
  }
}
