var sequence = require('../../lib/sequence');
var assert = require('assert');
var q = require('q');

describe('sequence test', function () {
    it('calls synchronous functions in order', function (done) {
        sequence([function () {
            return 'res1';
        }, function () {
            return 'res2';
        }, function () {
            return 'res3';
        }]).spread(function (res1, res2, res3) {
            assert(res1 === 'res1');
            assert(res2 === 'res2');
            assert(res3 === 'res3');
        }).then(function () {
            done();
        }).fail(function (err) {
            done(new Error(err));
        });
    });

    it('calls asynchronous functions in order', function (done) {
        sequence([function () {
            return q.resolve('res1').delay(500);
        }, function () {
            return q.resolve('res2').delay(500);
        }, function () {
            return q.resolve('res3').delay(500);
        }]).spread(function (res1, res2, res3) {
            assert(res1 === 'res1');
            assert(res2 === 'res2');
            assert(res3 === 'res3');
        }).then(function () {
            done();
        }).fail(function (err) {
            done(new Error(err));
        });
    });

    it('supports an array of functions', function (done) {
        sequence([function () {
            return q.resolve('res1').delay(500);
        }, function () {
            return q.resolve('res2').delay(500);
        }, function () {
            return q.resolve('res3').delay(500);
        }]).spread(function (res1, res2, res3) {
            assert(res1 === 'res1');
            assert(res2 === 'res2');
            assert(res3 === 'res3');
        }).then(function () {
            done();
        }).fail(function (err) {
            done(new Error(err));
        });
    });
});
