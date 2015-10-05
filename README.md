[![Build Status](https://travis-ci.org/dittach/loopback-connector-riak.svg?branch=master)](https://travis-ci.org/dittach/loopback-connector-riak)

## loopback-connector-riak

Riak connector for loopback-datasource-juggler.  This adapter is based on the [official Basho Riak client library](https://github.com/basho/riak-nodejs-client).

This adapter makes heavy use of Yokozuna, the Solr-backed search features of Riak 2.  It probably won't work with Riak 1.x at all.

## Customizing Riak configuration

The Riak connector can be configured much like any other Loopback connector using the datasources JSON files.

### Example datasources file

```javascript
{
  "db": {
    "name": "db",
    "connector": "riak",
    "host": [
      "riak1.local.foo.com:8087",
      "riak2.local.foo.com:8087",
      "riak3.local.foo.com:8087",
      "riak4.local.foo.com:8087",
      "riak5.local.foo.com:8087"
    ]
  }
}
```

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

## Things that aren't implemented yet

* bucket types

## Warnings

* Some things that are normal in other databases are expensive with Riak and this connector doesn't try to hide any of that, although it does try to take the shortest path (like looking up by key whenever possible.)

## Release notes

* 0.1.5 - Currently in production over at Dittach. Good test coverage.
* 0.0.5-0.1.0 - Improvements to test coverage, feature support, Node v0.12+ support.

## Testing

### Unit tests
The adapter has its own unit tests that don't hit the database.  To run those:

```shell
$ mocha test/api/*
```

There are also tests pulled in from loopback.  These *do* hit the database and they're written in a very SQL-oriented, ACID way that makes testing eventually consistent databases really difficult.  As a result we had to put a bunch of setTimeout statements in the tests to accomodate for indeterminate delays in things like populating indexes, etc.  This makes the test suite very slow.

While we've done our best to reset the state each time the tests are run, the recommendation is to nuke your Riak data entirely before running these tests with a rm -rf.  That directory is usually /var/lib/riak on Linux.

There are some tests that in the loopback suite will never pass such as the ones that verify that IDs are always integers.  In Riak keys are strings. ¯\_(ツ)_/¯

These tests can be run with:

```shell
$ mocha --timeout 60000
```
