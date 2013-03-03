//published dependencies
var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');
var q = require('q');
var request = require('request');
var GitHubApi = require("github");
var open = require('open');
//local dependencies
var gitconfig = require('./lib/git-config');
var travis = require('./lib/travis');
var _ = require('underscore');

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

var parseUserNameFromRemoteOriginUrl = function (remoteOriginUrl) {
    if (validSSHRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(/git@github\.com:([^\/]+)\/([^\/\.]+)\.git/)[1];
    } else if (validHTTPSRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\.]+)\.git/)[1];
    } else {
        return null;
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
        version: "3.0.0",
        // optional
        timeout: 5000
    });
};

Generator.prototype.repositoryInformation = function () {
    var cb = this.async();
    console.log('Requesting repository\'s user/organization and project name'.bold);

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

        var userName = parseUserNameFromRemoteOriginUrl(remoteOriginUrl);
        if (!userName) {
            console.log('Unable to determine user name from remote origin url');
            return;
        }

        var projectName = parseProjectNameFromRemoteOriginalUrl(remoteOriginUrl);
        if (!projectName) {
            console.log('Unable to determine project name from remote origin url');
            return;
        }

        that.userName = userName;
        that.projectName = projectName;
        console.log(that.userName, that.projectName);
        cb();
    });
};

Generator.prototype.gitHubLogin = function () {
    var cb = this.async();

    var prompts = [{
        name: 'username',
        message: 'GitHub username',
        default: that.userName
    }, {
        name: 'password',
        message: 'Password',
        silent: true
    }];

    this.prompt(prompts, function(err, props) {
        if (err) {
            return this.emit('error', err);
        }
        that.github.authenticate({
            type: "basic",
            username: props.username,
            password: props.password
        });
        cb();
    });
};

Generator.prototype.gitHubUserInfo = function () {
    var cb = this.async();
    that.github.user.get({}, function(err, res) {
        if(err) {
            return this.emit('error', err);
        }
        that.name = res.name;
        that.email = res.email;
        cb();
    });
};

Generator.prototype.ensureTravisAppAuthorized = function () {
    var cb = this.async();

    //single check for travis-ci app authorization
    var checkIfAuthorized = function() {
        var defer = q.defer();
        that.github.authorization.getAll({
        }, function(err, res) {
            if(!err && _.any(res, function(authorization) {
                return authorization.app.name === 'Travis' &&
                    authorization.app.url === 'https://travis-ci.org';
            })) {
                defer.resolve(res);
            } else {
                console.log('rejecting');
                defer.reject(err);
            }
        });
        return defer.promise;
    };
    //when the user presses a key, check for authorization
    var waitUntilAuthorized = function() {
        this.prompt([{
            message: 'Travis-ci.org github signup not complete. Press any key to retry.'
        }], function(err, props) {
            checkIfAuthorized().then(cb, waitUntilAuthorized);
        });
    }.bind(this);
    checkIfAuthorized().then(function() {
        console.log('authorized');
        cb();
    }, function() {
        //the user hasn't authorized the travis-ci app...show them the way
        open('https://github.com/login/oauth/authorize?client_id=f244293c729d5066cf27&redirect_uri=https%3A%2F%2Fapi.travis-ci.org%2Fauth%2Fhandshake&scope=public_repo%2Cuser%3Aemail&state=fpTyTGLMn9sZMjjYVLVhqA%3A%3A%3Ahttps%3A%2F%2Ftravis-ci.org%2F')
        waitUntilAuthorized();
    });
};

Generator.prototype.generateGitHubOAuthToken = function () {
    var cb = this.async();

    that.github.authorization.create({
        scopes: ['public_repo'],
        note: 'Pushing ' + that.projectName + ' grunt builds to gh-pages using travis-ci',
        note_url: 'http://travis-ci.org'
    }, function(err, res) {
        if (err) {
            return this.emit('error', err);
        }
        that.token = res.token;
        cb();
    })
};

Generator.prototype.encryptGitHubOAuthToken = function () {

};

Generator.prototype.syncTravisGithubRepositoryList = function () {

};

Generator.prototype.toggleTravisRepositoryHook = function () {

};

Generator.prototype.writeDotTravisFile = function () {
    if(!that.hasOwnProperty('secure')) {
        return this.emit('encrypted oauth token unavailable');
    }
    if(!that.hasOwnProperty('userName')) {
        return this.emit('user  namenot determined');
    }
    if(!that.hasOwnProperty('projectName')) {
        return this.emit('project name not determined');
    }
    if(!that.hasOwnProperty('email')) {
        return this.emit('user email unavailable');
    }
    if(!that.hasOwnProperty('name')) {
        return this.emit('user\'s full name unavailable');
    }

    console.log('writeDotTravisFile');
    this.directory('.', '.');
    this.template('.travis.yml', '.travis.yml', {
        secure: that.secure,
        userName: that.userName,
        projectName: that.projectName,
        email: that.email,
        name: that.name
    });
};
