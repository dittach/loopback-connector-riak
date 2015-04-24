// removes null and undefined values from a collection
module.exports = function(collection, callback) {
  for (var i = 0; i < collection.length; i++) {
    if (collection[i] == null || typeof(collection[i]) === "undefined") {
      collection.splice(i, 1);
      i--;
    }
  }

  callback(null, collection);
}
