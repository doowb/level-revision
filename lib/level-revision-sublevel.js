'use strict';

module.exports = LevelRevisionSublevel;

function LevelRevisionSublevel (db, options) {
  if (!(this instanceof LevelRevisionSublevel)) return new LevelRevisionSublevel(db, options);
  if (!options) {
    options = {};
  }
  this._sublevel = options.sublevel || 'revisions';
  this._db = db;
  this._revisions = this._db.sublevel(this._sublevel);
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

LevelRevisionSublevel.prototype.validate = function(key, value, options, cb) {
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

LevelRevisionSublevel.prototype.createBatch = function(key, value, cb) {
  value.rev = (value.rev || 0) + 1;
  var rows = [
    { type: 'put', key: key, value: value },
    { type: 'put', key: key.concat(value.rev), value: value, prefix: this._revisions }
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

LevelRevisionSublevel.prototype.getLast = function(key, options, cb) {
  var self = this;
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  options = options || {};
  key = Array.isArray(key) ? key : [key];

  var results = null;
  self._revisions.createReadStream({reverse: true, limit: 1, gte: key.concat(null), lt: key.concat(undefined)})
    .on('data', function (revision) {
      results = revision;
    })
    .on('end', function () {
      if (!results) {
        var err = new Error('NotFoundError');
        err.notFound = true;
        return cb(err);
      }
      cb(null, results.value);
    });
};
