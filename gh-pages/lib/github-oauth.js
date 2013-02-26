//curl -u 'username' -d '{"scopes":["repo"],"note":"push to gh-pages from travis"}' https://api.github.com/authorizations

var spawn = require('child_process').spawn;
var q = require('q');

var generate = function (user) {
    console.log('Github OAuth'.bold);
    console.log('To deploy to your gh-pages branch, travis must be granted a github oauth token.');
    console.log('Executing'.bold + ': ' + 'curl -u \'' + user + '\' -d \'{"scopes":["public_repo"],"note":"push to gh-pages from travis"}\' https://api.github.com/authorizations'.grey);

    var defer = q.defer();
    var token = null;

    var curlargs = [
        '-u',
        user,
        '-d',
        '{"scopes":["public_repo"],"note":"push to gh-pages from travis-ci"}',
        'https://api.github.com/authorizations'
    ];
    var curl = spawn('curl', curlargs);

    curl.stdout.on('data', function (data) {
        var payload = JSON.parse('' + data);
        if (payload && payload.hasOwnProperty('token')) {
            if (typeof payload.token === 'string' && payload.token.length === 40) {
                console.log('\n\ngithub oauth token generation...' + 'success'.green.bold + '\n\n');
                token = payload.token;
            } else {
                console.log('invalid github oauth token!'.red);
            }
        } else {
            console.log('github oauth token generation request failed'.red);
        }
    });

    curl.stderr.on('data', function (data) {
        var err = '' + data;
        if (err.indexOf('password') !== -1) {
            console.log(err);
        }
    });

    curl.on('exit', function () {
        if (token) {
            defer.resolve(token);
        } else {
            defer.reject();
        }
    });

    return defer.promise;
};

module.exports = {
    generate: generate
};
