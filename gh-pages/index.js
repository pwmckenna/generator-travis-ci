//published dependencies
var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');
var q = require('q');
var request = require('request');
var GitHubApi = require('github');
var browser = require('open');
var _ = require('lodash');
//var rsa = require('ursa');
//local dependencies
var gitconfig = require('./lib/git-config');
var TravisApi = require('./lib/travis');

var validHTTPSRemoteOriginUrl = function (remoteOriginUrl) {
    return remoteOriginUrl && typeof remoteOriginUrl === 'string' &&
        remoteOriginUrl.match(/https:\/\/github\.com\/[^\/]+\/[^\/\.]+\.git/);
};

var validSSHRemoteOriginUrl = function (remoteOriginUrl) {
    return remoteOriginUrl && typeof remoteOriginUrl === 'string' &&
        remoteOriginUrl.match(/git@github\.com:[^\/]+\/[^\/\.]+\.git/);
};

var parseProjectNameFromRemoteOriginalUrl = function (remoteOriginUrl) {
    if (validSSHRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(/git@github\.com:([^\/]+)\/([^\/\.]+)\.git/)[2];
    } else if (validHTTPSRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\.]+)\.git/)[2];
    } else {
        return null;
    }
};

var parseOwnerFromRemoteOriginUrl = function (remoteOriginUrl) {
    if (validSSHRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(/git@github\.com:([^\/]+)\/([^\/\.]+)\.git/)[1];
    } else if (validHTTPSRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\.]+)\.git/)[1];
    } else {
        return null;
    }
};

var untilResolved = function (fn, delay) {
    var defer = q.defer();
    var wrapper = function () {
        fn().then(function () {
            defer.resolve.apply(this, arguments);
        }, function () {
            setTimeout(wrapper, delay);
        });
    };
    wrapper();
    return defer.promise;
};

module.exports = Generator;

function Generator() {
    yeoman.generators.Base.apply(this, arguments);
    this.appname = path.basename(process.cwd());
    this.desc('This generator creates a .travis.yml that tells travis-ci to build your yeoman project and push the build to your gh-pages branch, on every commit to master.');
}

util.inherits(Generator, yeoman.generators.Base);

var that = {};

Generator.prototype.displayLogo = function () {
    // Welcome message
    var logo = '\n' +
    '\n   ╔══════════════════════════════════╗'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤'.red + '╔══════════════════════╗'.white + '¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤'.red + '║ '.white + '╔══════════════════╗'.red + ' ║'.white + '¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤'.red + '║ '.white + '║ ╔═════╗  ╔═════╗ ║'.red + ' ║'.white + '¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤'.red + '║ '.white + '╚═╝'.red + ' ╔═╗ '.white + '║  ║'.red + ' ╔═╗ '.white + '╚═╝'.red + ' ║'.white + '¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤'.red + '╚═════╝'.white + '¤'.red + '║ '.white + '║  ║'.red + ' ║'.white + '¤'.red + '╚═════╝'.white + '¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '║  ║'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '║  ║'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '║  ║'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '║  ║'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red + '╔╝ '.white + '║  ║'.red + ' ╚╗'.white + '¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '╔╝  ╚╗'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '╚════╝'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red + '╚════════╝'.white + '¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ╚══════════════════════════════════╝'.red +
    '\n\n';
    console.log(logo);
};

Generator.prototype.initializeGitHubApi = function () {
    that.github = new GitHubApi({
        // required
        version: '3.0.0',
    });
};

Generator.prototype.initializeTravisApi = function () {
    that.travis = new TravisApi({
        // required
        version: '2'
    });
};

Generator.prototype.repositoryInformation = function () {
    gitconfig.get('remote.origin.url').then(function (remoteOriginUrl) {
        if (!remoteOriginUrl) {
            console.log('This repository is not a valid github repository.');
            return;
        } else if (!validHTTPSRemoteOriginUrl(remoteOriginUrl) &&
            !validSSHRemoteOriginUrl(remoteOriginUrl)
        ) {
            console.log(remoteOriginUrl);
            console.log('This remote origin type is not supported');
            return;
        }

        var owner = parseOwnerFromRemoteOriginUrl(remoteOriginUrl);
        if (!owner) {
            console.log('Unable to determine user name from remote origin url');
            return;
        }

        var projectName = parseProjectNameFromRemoteOriginalUrl(remoteOriginUrl);
        if (!projectName) {
            console.log('Unable to determine project name from remote origin url');
            return;
        }

        that.owner = owner;
        that.projectName = projectName;
        console.log(that.owner, that.projectName);
    }).then(this.async());
};

Generator.prototype.gitHubLogin = function () {
    var cb = this.async();

    var prompts = [{
        name: 'username',
        message: 'GitHub Username',
        default: that.owner
    }, {
        name: 'password',
        message: 'GitHub Password',
        silent: true,
        replace: '*'
    }];

    this.prompt(prompts, function (err, props) {
        if (err) {
            return this.emit('error', err);
        }
        that.github.authenticate({
            type: 'basic',
            username: props.username,
            password: props.password
        });
        cb();
    }.bind(this));
};

Generator.prototype.gitHubUserInfo = function () {
    var cb = this.async();
    that.github.user.get({}, function (err, res) {
        if (err) {
            return this.emit('error', err);
        }
        that.name = res.name;
        that.email = res.email;
        cb();
    }.bind(this));
};

Generator.prototype.ensureTravisAppAuthorized = function () {
    var cb = this.async();

    //single check for travis-ci app authorization
    var checkIfAuthorized = function () {
        var defer = q.defer();
        that.github.authorization.getAll({
        }, function (err, res) {
            if (!err && _.any(res, function (authorization) {
                return authorization.app.name === 'Travis' &&
                    authorization.app.url === 'https://travis-ci.org';
            })) {
                defer.resolve(res);
            } else {
                defer.reject(err);
            }
        });
        return defer.promise;
    };
    //when the user presses a key, check for authorization
    var waitUntilAuthorized = function () {
        this.prompt([{
            message: 'Travis-ci.org github signup not complete. Press any key to retry.'
        }], function (err) {
            console.log('I didn\'t quite catch that...I guess it was a key press?', err);
            checkIfAuthorized().then(cb, waitUntilAuthorized);
        });
    }.bind(this);
    checkIfAuthorized().then(function () {
        cb();
    }, function () {
        //the user hasn't authorized the travis-ci app...show them the way
        var url = 'https://github.com/login/oauth/authorize?client_id=f244293c729d5066cf27&redirect_uri=https%3A%2F%2Fapi.travis-ci.org%2Fauth%2Fhandshake&scope=public_repo%2Cuser%3Aemail&state=fpTyTGLMn9sZMjjYVLVhqA%3A%3A%3Ahttps%3A%2F%2Ftravis-ci.org%2F';
        browser(url);
        waitUntilAuthorized();
    });
};

Generator.prototype.generateGitHubOAuthToken = function () {
    var cb = this.async();

    that.github.authorization.create({
        scopes: ['public_repo'],
        note: 'Pushing ' + that.projectName + ' grunt builds to gh-pages using travis-ci',
        note_url: 'http://travis-ci.org'
    }, function (err, res) {
        if (err) {
            return this.emit('error', err);
        }
        that.githubOAuthToken = res.token;
        cb();
    }.bind(this));
};

Generator.prototype.travisGitHubAuthentication = function () {
    var cb = this.async();

    that.travis.post('/auth/github', {
        github_token: that.githubOAuthToken
    }).then(function (res) {
        that.travisAccessToken = res.access_token;
        that.travis.authorize(that.travisAccessToken);
        cb();
    }, function () {
        this.emit('travis login failed');
    }.bind(this));
};

Generator.prototype.ensureTravisRepositoryHookSet = function () {
    var cb = this.async();

    var getHook = function () {
        return that.travis.get('/hooks').then(function (res) {
            var hooks = res.hooks;
            var hook = _.find(hooks, function (h) {
                return h.name === that.projectName && h.owner_name === that.owner;
            });
            if (hook) {
                return q.resolve(hook);
            } else {
                return q.reject();
            }
        });
    };

    var setHook = function (hook) {
        //no need to set the hook if its already set
        if (hook.active) {
            return q.resolve();
        }
        //lets set the hook
        hook.active = true;
        return that.travis.put('/hooks/' + hook.id, {
            hook: hook
        });
    };

    that.travis.post('/users/sync').then(function () {
        return untilResolved(function () {
            return getHook().then(setHook);
        }, 3000);
    }).then(function () {
        cb();
    }, function () {
        this.emit('travis sync failed');
    }.bind(this));
};

Generator.prototype.encryptGitHubOAuthToken = function () {
    var cb = this.async();
    var msg = 'GH_OAUTH_TOKEN=' + that.githubOAuthToken;
    // that.travis.get('/repos/' + that.owner + '/' + that.projectName + '/key').then(function (res) {
    //     var pem = res.key;
    //     pem = pem.replace('-----BEGIN RSA PUBLIC KEY-----', '-----BEGIN PUBLIC KEY-----');
    //     pem = pem.replace('-----END RSA PUBLIC KEY-----', '-----END PUBLIC KEY-----');

    //     var publicKey = rsa.createPublicKey(pem);
    //     var cipherText = publicKey.encrypt(msg).toString('base64');
    // });
    request.get({
        url: 'http://travis-encrypt.herokuapp.com',
        qs: {
            access_token: that.travisAccessToken,
            repository: that.owner + '/' + that.projectName,
            msg: msg
        }
    }, function (err, res, json) {
        if (err) {
            console.log('error encrypting github oauth token');
            return this.emit('error encrypting github oauth token', err);
        } else {
            console.log('success encrypting github oauth token');
            that.secure = json;
            cb();
        }
    }.bind(this));
};

Generator.prototype.writeDotTravisFile = function () {
    if (!that.hasOwnProperty('secure')) {
        return this.emit('encrypted oauth token unavailable');
    }
    if (!that.hasOwnProperty('owner')) {
        return this.emit('owner not determined');
    }
    if (!that.hasOwnProperty('projectName')) {
        return this.emit('project name not determined');
    }
    if (!that.hasOwnProperty('email')) {
        return this.emit('user email unavailable');
    }
    if (!that.hasOwnProperty('name')) {
        return this.emit('user\'s full name unavailable');
    }

    this.directory('.', '.');
    this.template('.travis.yml', '.travis.yml', {
        oauth: that.githubOAuthToken,
        secure: that.secure,
        owner: that.owner,
        projectName: that.projectName,
        email: that.email,
        name: that.name
    });
};
