//stop require from yapping unnecessarily
process.logging = false;

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
var rsa = require('ursa');
//local dependencies
var gitConfig = require('./git-config');
var gitRemoteParser = require('./git-remote-parser');
var TravisApi = require('./travis-http');

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

module.exports = TravisGenerator;

function TravisGenerator() {
    yeoman.generators.Base.apply(this, arguments);
    this._attributes = {};
}

util.inherits(TravisGenerator, yeoman.generators.Base);

TravisGenerator.prototype._get = function (key) {
    return this._attributes[key];
};

TravisGenerator.prototype._set = function (key, value) {
    this._attributes[key] = value;
};

TravisGenerator.prototype._has = function (key) {
    return this._attributes.hasOwnProperty(key);
};

TravisGenerator.prototype._displayLogo = function () {
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
    this.log(logo);
    return q.resolve();
};

TravisGenerator.prototype._initializeGitHubApi = function () {
    this._set('github', new GitHubApi({
        // required
        version: '3.0.0',
    }));
    return q.resolve();
};

TravisGenerator.prototype._initializeTravisApi = function () {
    this._set('travis', new TravisApi());
    return q.resolve();
};

TravisGenerator.prototype._repositoryInformation = function () {
    return gitConfig.get('remote.origin.url').then(function (remoteOriginUrl) {
        var owner = gitRemoteParser.getRepositoryOwner(remoteOriginUrl);
        var project = gitRemoteParser.getRepositoryName(remoteOriginUrl);

        this._set('owner', owner);
        this._set('projectName', project);

        assert(owner, 'Unable to determine user name from remote origin url');
        assert(project, 'Unable to determine project name from remote origin url');
        return q.resolve();
    }.bind(this));
};

TravisGenerator.prototype._gitHubLogin = function () {
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

TravisGenerator.prototype._gitHubUserInfo = function () {
    var defer = q.defer();
    this._get('github').user.get({}, defer.makeNodeResolver());
    return defer.promise.then(function (res) {
        this._set('name', res.name);
        this._set('email', res.email);
        return q.resolve();
    }.bind(this));
};

TravisGenerator.prototype._checkIfTravisGitHubAppAuthorized = function () {
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

TravisGenerator.prototype._showTravisAppAuthorizationSite = function () {
    //the user hasn't authorized the travis-ci app...show them the way
    var url = 'https://github.com/login/oauth/authorize?client_id=f244293c729d5066cf27&redirect_uri=https%3A%2F%2Fapi.travis-ci.org%2Fauth%2Fhandshake&scope=public_repo%2Cuser%3Aemail&state=fpTyTGLMn9sZMjjYVLVhqA%3A%3A%3Ahttps%3A%2F%2Ftravis-ci.org%2F';
    browser(url);
};

TravisGenerator.prototype._waitUntilTravisAppAuthorized = function () {
    var defer = q.defer();
    //when the user presses a key, check for authorization
    this.prompt([{
        message: 'Travis-ci.org GitHub signup not complete. Press any key to retry.'
    }], defer.makeNodeResolver());
    return defer.promise
        .then(this._checkIfTravisGitHubAppAuthorized.bind(this))
        .fail(this._waitUntilTravisAppAuthorized.bind(this));
};

TravisGenerator.prototype._ensureTravisAppAuthorized = function () {
    return this._checkIfTravisGitHubAppAuthorized().fail(function () {
        this._showTravisAppAuthorizationSite();
        return this._waitUntilTravisAppAuthorized();
    }.bind(this));
};

TravisGenerator.prototype._generateGitHubOAuthToken = function () {
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

TravisGenerator.prototype._revokeGitHubOAuthToken = function () {
    var defer = q.defer();
    this._get('github').authorization.delete({
        id: this._get('githubOAuthAuthorization').id
    }, defer.makeNodeResolver());
    return defer.promise;
};

TravisGenerator.prototype._travisGitHubAuthentication = function () {
    return this._get('travis').post('/auth/github', {
        github_token: this._get('githubOAuthAuthorization').token
    }).then(function (res) {
        this._set('travisAccessToken', res.access_token);
        this._get('travis').authorize(this._get('travisAccessToken'));
        return q.resolve();
    }.bind(this));
};

TravisGenerator.prototype._getTravisHook = function () {
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

TravisGenerator.prototype._setTravisHook = function (hook) {
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

TravisGenerator.prototype._ensureTravisRepositoryHookSet = function () {
    var attemptSet = function () {
        return this._getTravisHook.call(this).then(this._setTravisHook.bind(this));
    }.bind(this);
    return this._get('travis').post('/users/sync').then(function () {
        return untilResolved(attemptSet, 3000);
    }.bind(this), attemptSet);
};

TravisGenerator.prototype._encryptGitHubOAuthToken = function () {
    var defer = q.defer();
    var owner = this._get('owner');
    var projectName = this._get('projectName');
    return this._get('travis').get('/repos/' + owner + '/' + projectName + '/key').then(function (res) {
        console.log('response');
        var pem = res.key.replace(/RSA PUBLIC KEY/g, 'PUBLIC KEY');
        try {
            var publicKey = rsa.createPublicKey(pem);
            var msg = 'GH_OAUTH_TOKEN=' + this._get('githubOAuthAuthorization').token;
            var cipherText = publicKey.encrypt(msg, undefined, undefined, rsa.RSA_PKCS1_PADDING);
            this._set('secure', '"' + cipherText.toString('base64') + '"');
            return q.resolve();
        } catch (err) {
            this.log.write(err);
            return q.reject(err);
        }
    }.bind(this));
};

TravisGenerator.prototype._celebrate = function (message) {
    this.log.ok(message);
    return q.resolve();
};

TravisGenerator.prototype._mourn = function (message) {
    this.log.write('✗ '.red + message + '\n');
    return q.reject();
}
