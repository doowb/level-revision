# level-revision [![NPM version](https://badge.fury.io/js/level-revision.svg)](http://badge.fury.io/js/level-revision)  [![Build Status](https://travis-ci.org/doowb/level-revision.svg)](https://travis-ci.org/doowb/level-revision) 

> Add revision support to records in a level database.

## Goal

The goal of this library is to enable keeping revisions of documents stored in a [LevelUp] and easily querying and reading revisions.
This library allows you to choose the strategy for storing the revisions by passing in a library that [meets the strategy interface](#strategy-interface).

## Install with [npm](npmjs.org)

```bash
npm i level-revision --save
```

## Usage

```js
var LevelRevision = require('level-revision');
```

## API
### [LevelRevision](./index.js#L31)

Create an instance of a leveldb with revision support.

* `db` **{Object}**: [LevelUp] compatable instance.    
* `options` **{Object}**: Additional options    

```js
var LevelRevision = require('level-revision');
var level = require('level');
var db = level('path/to/db');
db = new LevelRevision(db);
```

### [.getLast](./index.js#L67)

* `key` **{String|Array}**: Key to search for.    
* `options` **{Object}**: Additional options    
* `cb` **{Function}**: Callback that takes `err` and `results`    

Get the last (most recent) revision for the given key.

### [.put](./index.js#L105)

Add a value to the database. Timestamp values will automatically be applied. When updating a value, the current `rev` property is required. If a `rev` property is supplied and it's not the latest, a `RevisionConflict` error will be returned along with the latest version. This allows handling the conflict.

* `key` **{String|Array}**: String or Array key to represent the value.    
* `value` **{Object}**: JSON object to store.    
* `options` **{Object}**: Additional options    
* `cb` **{Function}**: Callback function containing an `err` and `results` property.    

```js
// put new value
db.put(['item', '1'], { id: '1', description: 'Item 1'}, function (err, results) {
  //=> `err` Error when something went wrong
  //=> `results` = { id: '1', description: 'Item 1', createdAt: 1234567, modifiedAt: 1234567, rev: 1 };
});

// update existing value
db.put(['item', '1'], { id: '1', description: 'Item 1 details.', rev: 1 }, function (err, results) {
  //=> `err` Error when something went wrong
  //=> `results` = { id: '1', description: 'Item 1 details.', createdAt: 1234567, modifiedAt: 1234789, rev: 2 };
});

// update with conflicting value
db.put(['item', '1'], { id: '1', description: 'Description of item 1.', rev: 1 }, function (err, results) {
  //=> `err` = RevisionConflict { message: "Conflict updating revision 1. Current revision is at 2" };
  //=> `results = { id: '1', description: 'Item 1 details.', createdAt: 1234567, modifiedAt: 1234789, rev: 2 };
});
```

### [.get](./index.js#L153)

Get an item by the key.

* `key` **{String|Array}**: Key to look up.    
* `options` **{Object}**: Additional options.    
* `cb` **{Function}**: Callback function that takes `err` and `results`    

```js
db.get(['item-1'], function (err, results) {
  if (err) return console.log(err);
  //=> results
});
```

### [.del](./index.js#L173)

Remove an item and all of the revisions associated with the item.

* `key` **{String|Array}**: Key to delete    
* `options` **{Object}**: Additional options    
* `cb` **{Function}**: Callback function that takes `err`    

```js
db.del(['item-1'], function (err) {
  //=> err
});
```


## Strategy interface

### .construtor

The main constructor function passed on `.strategy` option when creating a new `LevelRevision` instance.

* `db` **{Object}**: [LevelUp] database instance to use when storing revision records.
* `options` **{Object}**: Additional options used when setting up this strategy.

### .validate

Validate the that given revision is one that can be updated.

* `key` **{String|Array}**:  Key of the row to look for.
* `value` **{Object}**:  New value to compare with.
* `options` **{Object}**:  Additional options
* `cb` **{Function}**:  Callback function that takes `err`, `valid`, and `conflict`

### .createBatch

Create a batch of records to save with the revision information.

* `key` **{String|Array}**: Key of the row being saved.
* `value` **{Object}**: Value being saved.
* `cb` **{Function}**: Callback function that takes `err` and `rows`.

### .getLast

Get the last (most recent) revision for the given key.

* `key` **{String|Array}**:  Key to search for.
* `options` **{Object}**:  Additional options
* `cb` **{Function}**:  Callback that takes `err` and `results`

## Strategies

If you make a strategy, please submit a PR to add it to [this list](./.verb.md#strategies)

- [Sublevel](https://github.com/doowb/level-revision-sublevel)
- [Embedded](https://github.com/doowb/level-revision-embed)

## Run tests

Install dev dependencies:

```bash
npm i -d && npm test
```

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/doowb/level-revision/issues)

## Author

**Brian Woodward**
 
+ [github/doowb](https://github.com/doowb)
+ [twitter/doowb](http://twitter.com/doowb) 

## License
Copyright (c) 2015 Brian Woodward  
Released under the MIT license

***

_This file was generated by [verb-cli](https://github.com/assemble/verb-cli) on March 30, 2015._

[LevelUp]: https://github.com/rvagg/node-levelup
