//published dependencies
var assert = require('assert');
var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');
var q = require('q');
var request = require('request');
var GitHubApi = require('github');
var browser = require('open');
var _ = require('lodash');
//local dependencies
var gitConfig = require('./lib/git-config');
var gitRemoteParser = require('./lib/git-remote-parser');
var TravisApi = require('./lib/travis-http');

var untilResolved = function (deferFunc, delay) {
    var defer = q.defer();
    var wrapper = function () {
        deferFunc().then(function () {
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
    this._attributes = {};
    this.appname = path.basename(process.cwd());
    this.desc('This generator creates a .travis.yml that tells travis-ci to build your yeoman project and push the build to your gh-pages branch, on every commit to master.');
}

util.inherits(Generator, yeoman.generators.Base);

Generator.prototype._get = function (key) {
    return this._attributes[key];
};

Generator.prototype._set = function (key, value) {
    this._attributes[key] = value;
};

Generator.prototype._has = function (key) {
    return this._attributes.hasOwnProperty(key);
};

Generator.prototype._displayLogo = function () {
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
    return q.resolve();
};

Generator.prototype._initializeGitHubApi = function () {
    this._set('github', new GitHubApi({
        // required
        version: '3.0.0',
    }));
    return q.resolve();
};

Generator.prototype._initializeTravisApi = function () {
    this._set('travis', new TravisApi());
    return q.resolve();
};

Generator.prototype._repositoryInformation = function () {
    return gitConfig.get('remote.origin.url').then(function (remoteOriginUrl) {
        var owner = gitRemoteParser.getRepositoryOwner(remoteOriginUrl);
        var project = gitRemoteParser.getRepositoryName(remoteOriginUrl);

        this._set('owner', owner);
        this._set('projectName', project);

        assert(owner, 'Unable to determine user name from remote origin url');
        assert(project, 'Unable to determine project name from remote origin url');

        console.log('Owner'.bold, owner);
        console.log('Project'.bold, project);
        return q.resolve();
    }.bind(this));
};

Generator.prototype._gitHubLogin = function () {
    var prompts = [{
        name: 'username',
        message: 'GitHub Username',
        default: this._get('owner')
    }, {
        name: 'password',
        message: 'GitHub Password',
        silent: true,
        replace: '*'
    }];

    var defer = q.defer();
    this.prompt(prompts, defer.makeNodeResolver());
    return defer.promise.then(function (props) {
        this._get('github').authenticate({
            type: 'basic',
            username: props.username,
            password: props.password
        });
        return q.resolve();
    }.bind(this));
};

Generator.prototype._gitHubUserInfo = function () {
    var defer = q.defer();
    this._get('github').user.get({}, defer.makeNodeResolver());
    return defer.promise.then(function (res) {
        this._set('name', res.name);
        this._set('email', res.email);
        return q.resolve();
    }.bind(this));
};

Generator.prototype._checkIfTravisGitHubAppAuthorized = function () {
    var defer = q.defer();
    this._get('github').authorization.getAll({}, defer.makeNodeResolver());
    return defer.promise.then(function (res) {
        if (_.any(res, function (authorization) {
            return authorization.app.name === 'Travis' &&
                authorization.app.url === 'https://travis-ci.org';
        })) {
            return q.resolve();
        } else {
            return q.reject();
        }
    });
};

Generator.prototype._showTravisAppAuthorizationSite = function () {
    //the user hasn't authorized the travis-ci app...show them the way
    var url = 'https://github.com/login/oauth/authorize?client_id=f244293c729d5066cf27&redirect_uri=https%3A%2F%2Fapi.travis-ci.org%2Fauth%2Fhandshake&scope=public_repo%2Cuser%3Aemail&state=fpTyTGLMn9sZMjjYVLVhqA%3A%3A%3Ahttps%3A%2F%2Ftravis-ci.org%2F';
    browser(url);
};

Generator.prototype._waitUntilTravisAppAuthorized = function () {
    var defer = q.defer();
    //when the user presses a key, check for authorization
    this.prompt([{
        message: 'Travis-ci.org GitHub signup not complete. Press any key to retry.'
    }], defer.makeNodeResolver());
    return defer.promise
        .then(this._checkIfTravisGitHubAppAuthorized.bind(this))
        .fail(this._waitUntilTravisAppAuthorized.bind(this));
};

Generator.prototype._ensureTravisAppAuthorized = function () {
    return this._checkIfTravisGitHubAppAuthorized().fail(function () {
        this._showTravisAppAuthorizationSite();
        return this._waitUntilTravisAppAuthorized();
    }.bind(this));
};

Generator.prototype._generateGitHubOAuthToken = function () {
    var defer = q.defer();
    this._get('github').authorization.create({
        scopes: ['public_repo'],
        note: 'Pushing ' + this._get('projectName') + ' grunt builds to gh-pages using travis-ci',
        note_url: 'http://travis-ci.org'
    }, defer.makeNodeResolver());
    return defer.promise.then(function (res) {
        this._set('githubOAuthAuthorization', res);
        return q.resolve();
    }.bind(this));
};

Generator.prototype._revokeGitHubOAuthToken = function () {
    var defer = q.defer();
    this._get('github').authorization.delete({
        id: this._get('githubOAuthAuthorization').id
    }, defer.makeNodeResolver());
    return defer.promise;
};

Generator.prototype._travisGitHubAuthentication = function () {
    return this._get('travis').post('/auth/github', {
        github_token: this._get('githubOAuthAuthorization').token
    }).then(function (res) {
        this._set('travisAccessToken', res.access_token);
        this._get('travis').authorize(this._get('travisAccessToken'));
        return q.resolve();
    }.bind(this));
};

Generator.prototype._getTravisHook = function () {
    return this._get('travis').get('/hooks').then(function (res) {
        var hooks = res.hooks;
        var hook = _.find(hooks, function (h) {
            return h.name === this._get('projectName') && h.owner_name === this._get('owner');
        }.bind(this));
        if (hook) {
            return q.resolve(hook);
        } else {
            return q.reject();
        }
    }.bind(this));
};

Generator.prototype._setTravisHook = function (hook) {
    //no need to set the hook if its already set
    if (hook.active) {
        return q.resolve();
    }
    //lets set the hook
    hook.active = true;
    return this._get('travis').put('/hooks/' + hook.id, {
        hook: hook
    });
};

Generator.prototype._ensureTravisRepositoryHookSet = function () {
    return this._get('travis').post('/users/sync').then(function () {
        return untilResolved(function () {
            return this._getTravisHook.call(this).then(this._setTravisHook.bind(this));
        }.bind(this), 3000);
    }.bind(this));
};

//var rsa = require('ursa');
//Generator.prototype.encryptGitHubOAuthToken = function () {
    // that.travis.get('/repos/' + that.owner + '/' + that.projectName + '/key').then(function (res) {
    //     var pem = res.key;
    //     pem = pem.replace('-----BEGIN RSA PUBLIC KEY-----', '-----BEGIN PUBLIC KEY-----');
    //     pem = pem.replace('-----END RSA PUBLIC KEY-----', '-----END PUBLIC KEY-----');

    //     var publicKey = rsa.createPublicKey(pem);
    //     var cipherText = publicKey.encrypt(msg).toString('base64');
    // });
//};

Generator.prototype._encryptGitHubOAuthToken = function () {
    var msg = 'GH_OAUTH_TOKEN=' + this._get('githubOAuthAuthorization').token;
    var defer = q.defer();
    request.get({
        url: 'http://travis-encrypt.herokuapp.com',
        qs: {
            access_token: this._get('travisAccessToken'),
            repository: this._get('owner') + '/' + this._get('projectName'),
            msg: msg
        }
    }, function (err, res, body) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(body);
        }
    });
    return defer.promise.then(function (body) {
        this._set('secure', body);
        return q.resolve();
    }.bind(this));
};

Generator.prototype._celebrate = function (message) {
    this.log.ok(message);
    return q.resolve();
};

Generator.prototype.writeDotTravisFile = function () {
    this._displayLogo()

        .then(this._initializeGitHubApi.bind(this))
        .then(this._celebrate.bind(this, 'Initialize GitHub Api'))

        .then(this._initializeTravisApi.bind(this))
        .then(this._celebrate.bind(this, 'Initialize TravisCi Api'))

        .then(this._repositoryInformation.bind(this))
        .then(this._celebrate.bind(this, 'Gather Repository Information'))

        .then(this._gitHubLogin.bind(this))
        .then(this._celebrate.bind(this, 'Login to GitHub Api'))

        .then(this._gitHubUserInfo.bind(this))
        .then(this._celebrate.bind(this, 'Gather GitHub User Information'))

        .then(this._ensureTravisAppAuthorized.bind(this))
        .then(this._celebrate.bind(this, 'Ensure GitHub Travis App Authorized'))

        .then(this._generateGitHubOAuthToken.bind(this))
        .then(this._celebrate.bind(this, 'Generate GitHub OAuth Token'))

        .then(this._travisGitHubAuthentication.bind(this))
        .then(this._celebrate.bind(this, 'Login to Travis-Ci Api'))

        .then(this._ensureTravisRepositoryHookSet.bind(this))
        .then(this._celebrate.bind(this, 'Ensure Travis Repository Hook Set'))

        .then(this._encryptGitHubOAuthToken.bind(this))
        .then(this._celebrate.bind(this, 'Encrypt GitHub OAuth Token'))

        .then(function () {
            assert(this._has('secure'), 'encrypted oauth token unavailable');
            assert(this._has('owner'), 'owner not determined');
            assert(this._has('projectName'), 'project name not determined');
            assert(this._has('email'), 'user email unavailable');
            assert(this._has('name'), 'user\'s full name unavailable');

            this.directory('.', '.');
            this.template('.travis.yml', '.travis.yml', {
                oauth: this._get('githubOAuthAuthorization').token,
                secure: this._get('secure'),
                owner: this._get('owner'),
                projectName: this._get('projectName'),
                email: this._get('email'),
                name: this._get('name')
            });
        }.bind(this))
        .then(this.async());
};
