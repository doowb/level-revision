'use strict';

var omit = require('object-omit');

module.exports = LevelRevisionEmbed;

function LevelRevisionEmbed (db, options) {
  if (!(this instanceof LevelRevisionEmbed)) return new LevelRevisionEmbed(db, options);
  if (!options) {
    options = {};
  }
  this._property = options.property || 'revisions';
  this._db = db;
}

/**
 * Validate the that given revision is one that can be updated.
 *
 * @param  {String|Array} `key` Key of the row to look for.
 * @param  {Object} `value` New value to compare with.
 * @param  {Object} `options` Additional options
 * @param  {Function} `cb` Callback function that takes `err`, `valid`, and `conflict`
 * @api public
 * @async
 */

LevelRevisionEmbed.prototype.validate = function(key, value, options, cb) {
  var self = this;
  key = Array.isArray(key) ? key : [key];

  this._db.get(key, function (err, current) {
    if (err && err.notFound) {
      return cb(null, true);
    }
    if (err) {
      return cb(err);
    }
    if (current.rev === value.rev) {
      return cb(null, true);
    }

    self.getLast(key, function (err, revision) {
      if (err) return cb(err);
      if (revision.rev > (value.rev || 0)) {
        cb(null, false, revision);
      }
    });
  });
};

/**
 * Create a batch of records to save with the revision information.
 *
 * @param  {String|Array} `key` Key of the row being saved.
 * @param  {Object} `value` Value being saved.
 * @param  {Function} `cb` Callback function that takes `err` and `rows`.
 * @api public
 * @async
 */

LevelRevisionEmbed.prototype.createBatch = function(key, value, cb) {
  value.rev = (value.rev || 0) + 1;

  var current = omit(value, [this._property]);
  value[this._property] = (value[this._property] || []).concat([current]);

  var rows = [
    { type: 'put', key: key, value: value },
    { type: 'put', key: key.concat(value.rev), value: key }
  ];
  cb(null, rows);
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

LevelRevisionEmbed.prototype.getLast = function(key, options, cb) {
  var self = this;
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  options = options || {};
  key = Array.isArray(key) ? key : [key];

  var results = null;
  self._db.get(key, function (err, item) {
    if (err) return cb(err);
    var len = item[self._property].length;
    var revision = item[self._property][len - 1];
    cb(null, revision);
  });
};
