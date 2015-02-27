'use strict';

var LevelRevision = require('../');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var assert = require('assert');
var async = require('async');
var level = require('level');
var path = require('path');

var dataPath = path.join(__dirname, '.data');
var dbPath = path.join(dataPath, '.test.db');

var _db = null;
var db = null;
describe('LevelRevision', function () {
  beforeEach(function (done) {
    rimraf(dataPath, function (err) {
      if (err) return done(err);
      mkdirp.sync(dataPath);
      _db = level(dbPath);
      db = new LevelRevision(_db);
      done();
    });
  });

  afterEach(function (done) {
    _db.close(function () {
      rimraf(dataPath, done);
    });
  });

  it('should put an item in the database', function (done) {
    db.put(['test-item-1'], { id: 'item-1', description: 'Item 1'}, function (err, item) {
      if (err) return done(err);
      assert(item != null, 'item should be valid');
      assert.equal(item.id, 'item-1');
      assert.ok(item.createdAt);
      assert.equal(item.createdAt, item.modifiedAt);
      assert.equal(item.rev, 1);

      db._revisions.get(['test-item-1', 1], function (err, revision) {
        if (err) return done(err);
        assert(revision != null, 'revision should be valid');
        assert.deepEqual(revision, item);
        done();
      });
    });
  });

  it('should update an item in the database', function (done) {
    db.put(['test-item-2'], { id: 'item-2', description: 'Item 2'}, function (err, item) {
      if (err) return done(err);
      item.description = 'Updated Item 2';
      db.put(['test-item-2'], item, function (err, item2) {
        if (err) return done(err);
        assert(item2 != null, 'item2 should be valid');
        assert.equal(item2.id, 'item-2');
        assert.ok(item2.createdAt);
        assert.notEqual(item2.createdAt, item2.modifiedAt);
        assert.equal(item2.rev, 2);
        done();
      });
    });
  });
});

