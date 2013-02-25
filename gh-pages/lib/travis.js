var spawn = require('child_process').spawn;
var q = require('q');

var encrypt = function (username, projectname, token) {
    console.log('Encrypting OAuth Token'.bold);
    console.log('To prevent your oauth token from being visible in travis-ci logs, it must be encrypted using the `travis` gem.');
    console.log('Executing'.bold + ': ' + 'travis encrypt GH_OAUTH_TOKEN=****************************************');
    console.log('\n\ngithub oauth token encryption...' + 'success'.green.bold + '\n\n');

    var defer = q.defer();
    var secure = null;

    var travisargs = [
        'encrypt',
        '-r',
        username + '/' + projectname,
        token
    ];
    var travis = spawn('travis', travisargs);

    travis.stdout.on('data', function (data) {
        secure = '' + data;
    });

    travis.stderr.on('data', function (data) {
        var err = '' + data;
        console.log(err);
    });

    travis.on('exit', function () {
        if (secure) {
            defer.resolve(secure);
        } else {
            defer.reject();
        }
    });
    return defer.promise;
};

module.exports = {
    encrypt: encrypt
};
