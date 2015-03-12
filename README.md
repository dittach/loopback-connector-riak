## loopback-connector-riak

Riak connector for loopback-datasource-juggler.  This adapter is based on the fine work of the RiakJS library (specifically the [Riak 2.0-friendly branch of RiakJS ](https://github.com/mostlyserious/riak-js/tree/metacomms-2.0), which Dittach has forked until it's merged into RiakJS mainline.)

This adapter makes heavy use of Yokozuna, the Solr-backed search features of Riak 2.  It probably won't work with Riak 1.x at all.

## Customizing Riak configuration

The Riak connector can be configured much like any other Loopback connector using the datasources JSON files.

### Example datasources file

```javascript
{
  "db": {
    "name":      "db",
    "debug":     true,
    "host":      "db.example.com"
    "port":      8098,
    "connector": "riak"
  }
}
```

Since Riak doesn't have a concept of databases, a prefix for buckets can be useful (if, for example, you want to use the same Riak instance for both test and development data.)  Here's how to specify a "Test" bucket prefix in your test datasources json file:

```javascript
{
  "db": {
    "name":         "db",
    "debug":        false,
    "host":         "127.0.0.1",
    "port":         8098,
    "bucketPrefix": "Test",
    "connector":    "riak"
  }
}
```

Your buckets and indexes will then be created with a Test prefix ("TestUser", "TestPost", etc.)

### Riak-oriented model configuration

Your Loopback models can provide some Riak-specific configuration options.  Here's an example of specifying the Yokozuna index to use for the attribute, if the index name is different than the attribute name:

```javascript
...
  "last_name": {
    "type":     "string",
    "required": true,
    "riak": {
      "yzField": "lname"
    }
  }
...
```

## Running tests

npm run test

## Things that aren't implemented

* bucket types
* 'not like' searches
* probably other things that we don't realize exist in Riak/StrongLoop - let us know

## Warnings

* Some things that are normal in other databases are expensive with Riak and this connector doesn't try to hide any of that, although it does try to take the shortest path (like looking up by key whenever possible.)

## Release notes

  * 0.0.5 - First open-source release. It's "working well for us."
