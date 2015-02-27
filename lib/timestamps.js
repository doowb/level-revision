'use strict';

module.exports = function timestamps (db, key, value, cb) {
  db.get(key, function (err, old) {
    if (err && !err.notFound) return cb(err);
    if (err) {
      value.createdAt =
      value.modifiedAt = Date.now();
    } else {
      value.createdAt = old.createdAt;
      value.modifiedAt = Date.now();
    }
    cb(null, value);
  });
};
