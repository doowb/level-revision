/*!
 * level-revision <https://github.com/doowb/level-revision>
 *
 * Copyright (c) 2015, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var sublevel = require('level-sublevel/bytewise');
var defaults = require('levelup-defaults');
var bytewise = require('bytewise');

module.exports = LevelRevision;

/**
 * Create an instance of a leveldb with revision support.
 *
 * ```js
 * var LevelRevision = require('level-revision');
 * var level = require('level');
 * var db = level('path/to/db');
 * db = new LevelRevision(db);
 * ```
 *
 * @param {Object} `db` [LevelUp] compatable instance.
 * @param {Object} `options` Additional options
 * @api public
 */

function LevelRevision (db, options) {
  var self = this;
  if (!(this instanceof LevelRevision)) {
    return new LevelRevision(db, options);
  }
  if (!options) {
    options = {};
  }

  if (!options.strategy) {
    throw new Error('LevelRevision expects a strategy for storing revisions.');
  }


  db = defaults(db, {
    keyEncoding: bytewise,
    valueEncoding: options.valueEncoding || 'json'
  });

  db = sublevel(db);

  this._db = db;
  this._strategy = options.strategy(this._db, options);
};


/**
 * Get the last (most recent) revision for the given key.
 *
 * @param  {String|Array} `key` Key to search for.
 * @param  {Object} `options` Additional options
 * @param  {Function} `cb` Callback that takes `err` and `results`
 * @api public
 * @async
 */

LevelRevision.prototype.getLast = function(key, options, cb) {
  this._strategy.getLast.apply(this._strategy, arguments);
};

/**
 * Add a value to the database. Timestamp values will automatically be applied.
 * When updating a value, the current `rev` property is required. If a `rev` property is supplied and
 * it's not the latest, a `RevisionConflict` error will be returned along with the latest version.
 * This allows handling the conflict.
 *
 * ```js
 * // put new value
 * db.put(['item', '1'], { id: '1', description: 'Item 1'}, function (err, results) {
 *   //=> `err` Error when something went wrong
 *   //=> `results` = { id: '1', description: 'Item 1', createdAt: 1234567, modifiedAt: 1234567, rev: 1 };
 * });
 *
 * // update existing value
 * db.put(['item', '1'], { id: '1', description: 'Item 1 details.', rev: 1 }, function (err, results) {
 *   //=> `err` Error when something went wrong
 *   //=> `results` = { id: '1', description: 'Item 1 details.', createdAt: 1234567, modifiedAt: 1234789, rev: 2 };
 * });
 *
 * // update with conflicting value
 * db.put(['item', '1'], { id: '1', description: 'Description of item 1.', rev: 1 }, function (err, results) {
 *   //=> `err` = RevisionConflict { message: "Conflict updating revision 1. Current revision is at 2" };
 *   //=> `results = { id: '1', description: 'Item 1 details.', createdAt: 1234567, modifiedAt: 1234789, rev: 2 };
 * });
 * ```
 *
 * @param  {String|Array} `key` String or Array key to represent the value.
 * @param  {Object} `value` JSON object to store.
 * @param  {Object} `options` Additional options
 * @param  {Function} `cb` Callback function containing an `err` and `results` property.
 * @api public
 * @async
 */

LevelRevision.prototype.put = function(key, value, options, cb) {
  var self = this;
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  options = options || {};
  key = Array.isArray(key) ? key : [key];

  // TODO: simplify this with async to make more readable
  this._strategy.validate(key, value, options, function (err, valid, conflict) {
    if (err) return cb(err);
    if (!valid) {
      return cb(new Error([
          'RevisionConflict: Conflict updating revision',
          value.rev + '.',
          'Current revision is at',
          conflict.rev + '.'
        ].join(' ')),
      conflict);
    }
    self._strategy.createBatch(key, value, function (err, rows) {
      if (err) return cb(err);
      self._db.batch(rows, function (err) {
        if (err) return cb(err);
        self._db.get(key, cb);
      });
    });
  });
};

/**
 * Get an item by the key.
 *
 * ```js
 * db.get(['item-1'], function (err, results) {
 *   if (err) return console.log(err);
 *   //=> results
 * });
 * ```
 *
 * @param  {String|Array} `key` Key to look up.
 * @param  {Object} `options` Additional options.
 * @param  {Function} `cb` Callback function that takes `err` and `results`
 * @api public
 * @async
 */

LevelRevision.prototype.get = function(key, options, cb) {
  this._db.get(key, options, cb);
};

/**
 * Remove an item and all of the revisions associated with the item.
 *
 * ```js
 * db.del(['item-1'], function (err) {
 *   //=> err
 * });
 * ```
 *
 * @param  {String|Array} `key` Key to delete
 * @param  {Object} `options` Additional options
 * @param  {Function} `cb` Callback function that takes `err`
 * @api public
 * @async
 */

LevelRevision.prototype.del = function(key, options, cb) {
  key = Array.isArray(key) ? key : [key];
  this._db.del.apply(this._db, key, options, cb);
};

LevelRevision.prototype.batch = function(rows, options, cb) {
  return this._db.batch.apply(this._db, arguments);
};

LevelRevision.prototype.readStream =
LevelRevision.prototype.createReadStream = function(options) {
  return this._db.createReadStream.apply(this._db, arguments);
};

LevelRevision.prototype.keyStream =
LevelRevision.prototype.createKeyStream = function(options) {
  return this._db.createKeyStream.apply(this._db, arguments);
};

LevelRevision.prototype.valueStream =
LevelRevision.prototype.createValueStream = function(options) {
  return this._db.createValueStream.apply(this._db, arguments);
};

LevelRevision.prototype.writeStream =
LevelRevision.prototype.createWriteStream = function(options) {
  return this._db.createWriteStream.apply(this._db, arguments);
};

LevelRevision.prototype.close = function(cb) {
  this._db.close(cb);
};
