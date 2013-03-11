//published dependencies
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
var TravisApi = require('./lib/travis');

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

var assert = function (condition, message) {
    if (!condition) {
        throw message;
    }
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
    that.travis = new TravisApi();
};

Generator.prototype.repositoryInformation = function () {
    gitConfig.get('remote.origin.url').then(function (remoteOriginUrl) {
        that.owner = gitRemoteParser.getRepositoryOwner(remoteOriginUrl);
        that.projectName = gitRemoteParser.getRepositoryName(remoteOriginUrl);

        assert(that.owner, 'Unable to determine user name from remote origin url');
        assert(that.projectName, 'Unable to determine project name from remote origin url');

        console.log(that.owner, that.projectName);
    }).then(this.async());
};

Generator.prototype.gitHubLogin = function () {
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

    var defer = q.defer();
    this.prompt(prompts, defer.makeNodeResolver());
    defer.promise.then(function (props) {
        that.github.authenticate({
            type: 'basic',
            username: props.username,
            password: props.password
        });
        console.log('github auth complete');
        return q.resolve();
    }).then(this.async());
};

Generator.prototype.gitHubUserInfo = function () {
    var defer = q.defer();
    that.github.user.get({}, defer.makeNodeResolver());
    defer.promise.then(function (res) {
        that.name = res.name;
        that.email = res.email;
        console.log('github info complete');
        return q.resolve();
    }).then(this.async());
};

//single check for travis-ci app authorization
var checkIfTravisGitHubAppAuthorized = function (github) {
    var defer = q.defer();
    github.authorization.getAll({}, defer.makeNodeResolver());
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

var showTravisAppAuthorizationSite = function () {
    //the user hasn't authorized the travis-ci app...show them the way
    var url = 'https://github.com/login/oauth/authorize?client_id=f244293c729d5066cf27&redirect_uri=https%3A%2F%2Fapi.travis-ci.org%2Fauth%2Fhandshake&scope=public_repo%2Cuser%3Aemail&state=fpTyTGLMn9sZMjjYVLVhqA%3A%3A%3Ahttps%3A%2F%2Ftravis-ci.org%2F';
    browser(url);
};

Generator.prototype.ensureTravisAppAuthorized = function () {
    console.log('ensure travis app authorized');
    //when the user presses a key, check for authorization
    var waitUntilTravisAppAuthorized = function () {
        var defer = q.defer();
        this.prompt([{
            message: 'Travis-ci.org GitHub signup not complete. Press any key to retry.'
        }], defer.makeNodeResolver());
        var check = _.partial(checkIfTravisGitHubAppAuthorized, that.github);
        return defer.promise.then(check).fail(waitUntilTravisAppAuthorized);
    }.bind(this);

    checkIfTravisGitHubAppAuthorized(that.github).fail(function () {
        showTravisAppAuthorizationSite();
        waitUntilTravisAppAuthorized();
    }).then(this.async());
};

Generator.prototype.generateGitHubOAuthToken = function () {
    var defer = q.defer();
    that.github.authorization.create({
        scopes: ['public_repo'],
        note: 'Pushing ' + that.projectName + ' grunt builds to gh-pages using travis-ci',
        note_url: 'http://travis-ci.org'
    }, defer.makeNodeResolver());
    defer.promise.then(function (res) {
        that.githubOAuthToken = res.token;
        return q.resolve();
    }).then(this.async());
};

Generator.prototype.travisGitHubAuthentication = function () {
    that.travis.post('/auth/github', {
        github_token: that.githubOAuthToken
    }).then(function (res) {
        that.travisAccessToken = res.access_token;
        that.travis.authorize(that.travisAccessToken);
        return q.resolve();
    }).then(this.async());
};

var getTravisHook = function (travis, owner, project) {
    return travis.get('/hooks').then(function (res) {
        var hooks = res.hooks;
        var hook = _.find(hooks, function (h) {
            return h.name === project && h.owner_name === owner;
        });
        if (hook) {
            return q.resolve(hook);
        } else {
            return q.reject();
        }
    });
};

var setTravisHook = function (travis, hook) {
    //no need to set the hook if its already set
    if (hook.active) {
        return q.resolve();
    }
    //lets set the hook
    hook.active = true;
    return travis.put('/hooks/' + hook.id, {
        hook: hook
    });
};

Generator.prototype.ensureTravisRepositoryHookSet = function () {
    var get = _.partial(getTravisHook, that.travis, that.owner, that.projectName);
    var set = _.partial(setTravisHook, that.travis);
    that.travis.post('/users/sync').then(function () {
        return untilResolved(function () {
            return get().then(set);
        }, 3000);
    }).then(this.async());
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

Generator.prototype.encryptGitHubOAuthToken = function () {
    var cb = this.async();
    var msg = 'GH_OAUTH_TOKEN=' + that.githubOAuthToken;
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
    assert(that.hasOwnProperty('secure'), 'encrypted oauth token unavailable');
    assert(that.hasOwnProperty('owner'), 'owner not determined');
    assert(that.hasOwnProperty('projectName'), 'project name not determined');
    assert(that.hasOwnProperty('email'), 'user email unavailable');
    assert(that.hasOwnProperty('name'), 'user\'s full name unavailable');

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
