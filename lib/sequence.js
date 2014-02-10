var _ = require('lodash');
var q = require('q');

module.exports = function (funcs) {
    var results = [];
    return _.reduce(funcs, function (memo, fn) {
        return memo.then(fn).then(results.push.bind(results));
    }, q.resolve()).thenResolve(results);
};
