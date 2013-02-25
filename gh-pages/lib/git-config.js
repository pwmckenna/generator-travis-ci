var q = require('q');
var spawn = require('child_process').spawn;

module.exports = {
    get: function (key) {
        var ret = new q.defer();
        var stdout = '';
        var args = ['config', key];
        var proc = spawn('git', args);
        proc.stdout.on('data', function (data) {
            stdout += data;
        });

        proc.stdout.on('end', function () {
            ret.resolve(stdout.trim());
        });
        return ret.promise;
    }
};
