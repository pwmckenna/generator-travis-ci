//published dependencies
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');
var q = require('q');
var GitHubApi = require('github');
var browser = require('open');
var _ = require('lodash');
var rsa = require('ursa');
var Repo = require('git-tools');
var chalk = require('chalk');

//local dependencies
var gitRemoteParser = require('./git-remote-parser');
var Travis = require('travis-ci');

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

var seq = function (funcs) {
    if (funcs.length === 0) {
        return q.resolve([]);
    }

    var fn = _.first(funcs);
    return fn().then(function (result) {
        return seq(_.rest(funcs)).then(function (results) {
            return q.resolve([result].concat(results));
        });
    });
};

function TravisGenerator() {
    yeoman.generators.Base.apply(this, arguments);
    this.attributes = {};
}

module.exports = TravisGenerator;

util.inherits(TravisGenerator, yeoman.generators.Base);

TravisGenerator.prototype.get = function (key) {
    return this.attributes[key];
};

TravisGenerator.prototype.set = function (key, value) {
    this.attributes[key] = value;
};

TravisGenerator.prototype.has = function (key) {
    return this.attributes.hasOwnProperty(key);
};

TravisGenerator.prototype.displayLogo = function () {
    // Welcome message
    var logo = '\n' +
    chalk.red('\n   ╔══════════════════════════════════╗') +
    chalk.red('\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤') + chalk.white('╔══════════════════════╗') + chalk.red('¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤') + chalk.white('║ ') + chalk.red('╔══════════════════╗') + chalk.white(' ║') + chalk.red('¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤') + chalk.white('║ ') + chalk.red('║ ╔═════╗  ╔═════╗ ║') + chalk.white(' ║') + chalk.red('¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤') + chalk.white('║ ') + chalk.red('╚═╝') + chalk.white(' ╔═╗ ') + chalk.red('║  ║') + chalk.white(' ╔═╗ ') + chalk.red('╚═╝') + chalk.white(' ║') + chalk.red('¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤') + chalk.white('╚═════╝') + chalk.red('¤') + chalk.white('║ ') + chalk.red('║  ║') + chalk.white(' ║') + chalk.red('¤') + chalk.white('╚═════╝') + chalk.red('¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤') + chalk.white('║ ') + chalk.red('║  ║') + chalk.white(' ║') + chalk.red('¤¤¤¤¤¤¤¤¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤') + chalk.white('║ ') + chalk.red('║  ║') + chalk.white(' ║') + chalk.red('¤¤¤¤¤¤¤¤¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤') + chalk.white('║ ') + chalk.red('║  ║') + chalk.white(' ║') + chalk.red('¤¤¤¤¤¤¤¤¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤') + chalk.white('║ ') + chalk.red('║  ║') + chalk.white(' ║') + chalk.red('¤¤¤¤¤¤¤¤¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤¤¤¤¤¤¤¤') + chalk.white('╔╝ ') + chalk.red('║  ║') + chalk.white(' ╚╗') + chalk.red('¤¤¤¤¤¤¤¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤¤¤¤¤¤¤¤') + chalk.white('║ ') + chalk.red('╔╝  ╚╗') + chalk.white(' ║') + chalk.red('¤¤¤¤¤¤¤¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤¤¤¤¤¤¤¤') + chalk.white('║ ') + chalk.red('╚════╝') + chalk.white(' ║') + chalk.red('¤¤¤¤¤¤¤¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤¤¤¤¤¤¤¤') + chalk.white('╚════════╝') + chalk.red('¤¤¤¤¤¤¤¤¤¤¤¤║') +
    chalk.red('\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤║') +
    chalk.red('\n   ╚══════════════════════════════════╝') +
    '\n\n';
    this.log(logo);
    return q.resolve();
};

TravisGenerator.prototype.initializeGitHubApi = function () {
    this.set('github', new GitHubApi({
        // required
        version: '3.0.0',
    }));
    return q.resolve();
};

TravisGenerator.prototype.initializeTravisApi = function () {
    this.set('travis', new Travis({
        version: '2.0.0'
    }));
    return q.resolve();
};

TravisGenerator.prototype.repositoryInformation = function () {
    var defer = q.defer();
    var cwd = process.cwd();
    var repo = new Repo(cwd);
    repo.remotes(defer.makeNodeResolver());
    return defer.promise.then(function (remotes) {
        if (remotes.length > 0) {
            var remoteOriginUrl = remotes[0].url;
            var owner = gitRemoteParser.getRepositoryOwner(remoteOriginUrl);
            var project = gitRemoteParser.getRepositoryName(remoteOriginUrl);

            assert(owner, 'Unable to determine user name from remote origin url');
            assert(project, 'Unable to determine project name from remote origin url');

            this.set('owner', owner);
            this.set('projectName', project);

            return q.resolve();
        } else {
            return q.reject();
        }
    }.bind(this));
};

TravisGenerator.prototype.isUserOrganizationProject = function () {
    var owner = this.get('owner');
    var projectName = this.get('projectName');

    return (projectName === (owner + '.github.io')) || (projectName === (owner + '.github.com'));
};

TravisGenerator.prototype.setSourceBranch = function () {
    if (this.isUserOrganizationProject()) {
        var defer = q.defer();
        this.log.write('\n');
        this.prompt({
            name: 'destination',
            default: 'development',
            message: 'User & Organization pages build into the master branch. Which branch would you like to develop in?',
        }, function (props) {
            this.set('sourceBranch', props.destination);
            this.log.write('\n');
            defer.resolve();
        }.bind(this));
        return defer.promise;
    } else {
        this.set('sourceBranch', 'master');
        return q.resolve();
    }
};

TravisGenerator.prototype.setDestinationBranch = function () {
    if (this.isUserOrganizationProject()) {
        this.set('destinationBranch', 'master');
    } else {
        this.set('destinationBranch', 'gh-pages');
    }
};

TravisGenerator.prototype.gitHubLogin = function () {
    this.log.write('\n');
    var prompts = [{
        name: 'username',
        message: 'GitHub Username',
        default: this.get('owner')
    }, {
        name: 'password',
        message: 'GitHub Password',
        type: 'password'
    }];

    var defer = q.defer();
    this.prompt(prompts, function (props) {
        this.get('github').authenticate({
            type: 'basic',
            username: props.username,
            password: props.password
        });
        this.log.write('\n');
        defer.resolve();
    }.bind(this));
    return defer.promise;
};

TravisGenerator.prototype.gitHubUserInfo = function () {
    var defer = q.defer();
    this.get('github').user.get({}, defer.makeNodeResolver());
    return defer.promise.then(function (res) {
        this.set('name', res.name);
        this.set('email', res.email);
        return q.resolve();
    }.bind(this));
};

TravisGenerator.prototype.checkIfTravisGitHubAppAuthorized = function () {
    var defer = q.defer();
    this.get('github').authorization.getAll({}, defer.makeNodeResolver());
    return defer.promise.then(function (res) {
        if (_.any(res, function (authorization) {
            return authorization.app.name === 'Travis CI' &&
                authorization.app.url === 'https://travis-ci.org';
        })) {
            return q.resolve();
        } else {
            return q.reject();
        }
    });
};

TravisGenerator.prototype.showTravisAppAuthorizationSite = function () {
    //the user hasn't authorized the travis-ci app...show them the way
    var url = 'https://github.com/login/oauth/authorize?client_id=f244293c729d5066cf27&redirect_uri=https%3A%2F%2Fapi.travis-ci.org%2Fauth%2Fhandshake&scope=public_repo%2Cuser%3Aemail&state=fpTyTGLMn9sZMjjYVLVhqA%3A%3A%3Ahttps%3A%2F%2Ftravis-ci.org%2F';
    browser(url);
};

TravisGenerator.prototype.waitUntilTravisAppAuthorized = function () {
    var defer = q.defer();
    //when the user presses a key, check for authorization
    this.log.write('\n');
    this.prompt([{
        message: 'Travis-ci.org GitHub signup not complete. Press any key to retry.'
    }], defer.makeNodeResolver());
    defer.promise.fin(function () {
        this.log.write('\n');
    }.bind(this));
    return defer.promise
        .then(this.checkIfTravisGitHubAppAuthorized.bind(this))
        .fail(this.waitUntilTravisAppAuthorized.bind(this));
};

TravisGenerator.prototype.ensureTravisAppAuthorized = function () {
    return this.checkIfTravisGitHubAppAuthorized().fail(function () {
        this.showTravisAppAuthorizationSite();
        return this.waitUntilTravisAppAuthorized();
    }.bind(this));
};

TravisGenerator.prototype.generateGitHubOAuthToken = function () {
    var defer = q.defer();
    this.get('github').authorization.create({
        scopes: ['public_repo'],
        note: this.get('projectName') + ' (generator-travis-ci)',
        note_url: 'https://github.com/pwmckenna/generator-travis-ci'
    }, defer.makeNodeResolver());
    return defer.promise.then(function (res) {
        this.set('githubOAuthAuthorization', res);
        return q.resolve();
    }.bind(this));
};

TravisGenerator.prototype.revokeGitHubOAuthToken = function () {
    var defer = q.defer();
    this.get('github').authorization.delete({
        id: this.get('githubOAuthAuthorization').id
    }, defer.makeNodeResolver());
    return defer.promise;
};

TravisGenerator.prototype.travisGitHubAuthentication = function () {
    var authRequest = q.defer();
    this.get('travis').auth.github({
        github_token: this.get('githubOAuthAuthorization').token
    }, authRequest.makeNodeResolver());
    return authRequest.promise.then(function (res) {
        this.set('travisAccessToken', res.access_token);
        var authorizeRequest = q.defer();
        this.get('travis').authenticate(res, authorizeRequest.makeNodeResolver());
        return authorizeRequest.promise;
    }.bind(this));
};

TravisGenerator.prototype.getTravisHook = function () {
    var hooksRequest = q.defer();
    this.get('travis').hooks(hooksRequest.makeNodeResolver());
    return hooksRequest.promise.then(function (res) {
        var hooks = res.hooks;
        var hook = _.find(hooks, function (h) {
            return h.name === this.get('projectName') && h.owner_name === this.get('owner');
        }.bind(this));
        if (hook) {
            return q.resolve(hook);
        } else {
            return q.reject();
        }
    }.bind(this));
};

TravisGenerator.prototype.setTravisHook = function (hook) {
    //no need to set the hook if its already set
    if (hook.active) {
        return q.resolve();
    }
    //lets set the hook
    hook.active = true;
    var setHookRequest = q.defer();
    this.get('travis').hooks({
        id: hook.id,
        hook: hook
    }, setHookRequest.makeNodeResolver());
    return setHookRequest.promise;
};

TravisGenerator.prototype.ensureTravisRepositoryHookSet = function () {
    var attemptSet = function () {
        return this.getTravisHook.call(this).then(this.setTravisHook.bind(this));
    }.bind(this);
    var syncRequest = q.defer();
    this.get('travis').users.sync(syncRequest.makeNodeResolver());
    return syncRequest.promise.then(function () {
        return untilResolved(attemptSet, 3000);
    }.bind(this), attemptSet);
};

TravisGenerator.prototype.encryptGitHubOAuthToken = function () {
    var owner = this.get('owner');
    var projectName = this.get('projectName');
    var getKeyRequest = q.defer();
    this.get('travis').repos.key({
        owner_name: owner,
        name: projectName
    }, getKeyRequest.makeNodeResolver());
    return getKeyRequest.promise.then(function (res) {
        var pem = res.key.replace(/RSA PUBLIC KEY/g, 'PUBLIC KEY');
        try {
            var publicKey = rsa.createPublicKey(pem);
            var msg = 'GH_OAUTH_TOKEN=' + this.get('githubOAuthAuthorization').token;
            var cipherText = publicKey.encrypt(msg, undefined, undefined, rsa.RSA_PKCS1_PADDING);
            this.set('secure', '"' + cipherText.toString('base64') + '"');
            return q.resolve();
        } catch (err) {
            this.mourn(err);
            return q.reject(err);
        }
    }.bind(this));
};

TravisGenerator.prototype.insertReadmeStatusImage = function () {
    this.log.write('\n');
    var readmeTypes = {
        'markdown': {
            template: '[![Build Status](https://travis-ci.org/<%= owner %>/<%= projectName %>.png?branch=master)](https://travis-ci.org/<%= owner %>/<%= projectName %>)',
            extensions: [
                '.markdown', '.mdown', '.mkdn', '.md', '.mkd', '.mdwn', '.mdtxt', '.mdtext'
            ]
        },
        'texttile': {
            template: '!https://travis-ci.org/<%= owner %>/<%= projectName %>.png?branch=master!:https://travis-ci.org/<%= owner %>/<%= projectName %>',
            extensions: [
                '.textile'
            ]
        },
        'rdoc': {
            template: '{<img src="https://travis-ci.org/<%= owner %>/<%= projectName %>.png?branch=master" alt="Build Status" />}[https://travis-ci.org/<%= owner %>/<%= projectName %>]',
            extensions: [
                '.rdoc'
            ]
        },
        'asciidoc': {
            template: 'image:https://travis-ci.org/<%= owner %>/<%= projectName %>.png?branch=master["Build Status", link="https://travis-ci.org/<%= owner %>/<%= projectName %>"]',
            extensions: [
                '.asciidoc'
            ]
        }
    };

    var owner = this.get('owner');
    var projectName = this.get('projectName');
    var funcs = [];
    _.each(readmeTypes, function (readmeType) {
        var template = readmeType.template;
        _.each(readmeType.extensions, function (extension) {
            var readmePath = path.join(process.cwd(), 'README' + extension);
            if (fs.existsSync(readmePath)) {
                this.log.ok(readmePath);
                funcs.push(function () {
                    var defer = q.defer();
                    this.prompt({
                        name: 'icon',
                        message: 'Append a Travis-CI status icon to README' + extension + '?',
                        default: 'Y/n'
                    }, function (props) {
                        if ((/y/i).test(props.icon)) {
                            fs.appendFileSync(readmePath, _.template(template, {
                                owner: owner,
                                projectName: projectName
                            }));
                        }
                        defer.resolve();
                    }.bind(this));
                    return defer.promise;
                }.bind(this));
            }
        }, this);
    }, this);
    if (funcs.length === 0) {
        funcs.push(function () {
            var defer = q.defer();
            this.prompt({
                name: 'icon',
                message: 'Create a README.markdown file containing a Travis-CI status icon?',
                default: 'Y/n'
            }, function (props) {
                if ((/y/i).test(props.icon)) {
                    var readmePath = path.join(process.cwd(), 'README.markdown');
                    fs.appendFileSync(readmePath, _.template(readmeTypes.markdown.template, {
                        owner: owner,
                        projectName: projectName
                    }));
                }
                defer.resolve();
            }.bind(this));
            return defer.promise;
        }.bind(this));
    }
    return seq(funcs).then(function () {
        this.log.write('\n');
    }.bind(this));
};

TravisGenerator.prototype.celebrate = function (message) {
    var log = this.log;
    return function (res) {
        log.write(chalk.green('√ ') + message + '\n');
        return q.resolve(res);
    };
};

TravisGenerator.prototype.mourn = function (message) {
    var log = this.log;
    return function (err) {
        log.write(chalk.red('✗ ') + message + '\n');
        return q.reject(err);
    };
};
