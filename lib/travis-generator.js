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
var sequence = require('./sequence');

//local dependencies
var gitRemoteParser = require('./git-remote-parser');
var Travis = require('travis-ci');

var README_TYPES = {
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

var TRAVIS_CI_GITHUB_CLIENT_ID = 'f244293c729d5066cf27';

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

var cacheFunction = function (fn) {
    return _.memoize(fn, function () { return true; });
};

var cacheFunctions = function (ctx) {
    _.each(_.rest(arguments), function (name) {
        assert(ctx[name], name);
        ctx[name] = cacheFunction(ctx[name]);
    });
};

var logFunction = function (fn, msg) {
    return function () {
        var fnRes = fn.apply(this, arguments);
        q.resolve().then(function () {
            return fnRes;
        }).then(function () {
            this.log.write(chalk.green('√ ') + msg + '\n');
        }.bind(this)).fail(function (err) {
            this.log.write(chalk.red('✗ ') + msg + ' - ' + err.toString() + '\n');
        }.bind(this));
        return fnRes;
    };
};

var logFunctions = function (ctx, map) {
    _.each(map, function (msg, name) {
        assert(ctx[name], name);
        ctx[name] = logFunction(ctx[name], msg);
    });
};

var TravisGenerator = function () {
    yeoman.generators.Base.apply(this, arguments);
    logFunctions(this, {
        'getOwner': 'get repository owner',
        'getProjectName': 'get project name',
        'getSourceBranch': 'get source branch',
        'getDestinationBranch': 'get build output branch',
        'getName': 'get user name',
        'getEmail': 'get user email',
        'ensureTravisAppAuthorized': 'travis github app authorized',
        'getGitHubOAuthToken': 'generate github oauth token',
        'revokeGitHubOAuthToken': 'revoke github oauth token',
        'ensureTravisRepositoryHookSet': 'set travis repository test hook',
        'getEncryptedGitHubOAuthToken': 'encrypt github oauth token'
    });
    cacheFunctions(this,
        'getOwner',
        'getProjectName',
        'getSourceBranch',
        'getDestinationBranch',
        'getName',
        'getEmail',
        'ensureTravisAppAuthorized',
        'getGitHubOAuthToken',
        'revokeGitHubOAuthToken',
        'ensureTravisRepositoryHookSet',
        'getEncryptedGitHubOAuthToken',
        'getTokenAuthenticatedGitHub',
        'getBasicAuthenticatedGitHub',
        'getUsername',
        'getPassword',
        'getGithubOTP'
    );
};

module.exports = TravisGenerator;

util.inherits(TravisGenerator, yeoman.generators.Base);

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


TravisGenerator.prototype.prompt = function (questions) {
    var defer = q.defer();
    yeoman.generators.Base.prototype.prompt.call(this, questions, defer.resolve);
    return defer.promise;
};

TravisGenerator.prototype.getOwner = function () {
    var defer = q.defer();
    var cwd = process.cwd();
    var repo = new Repo(cwd);
    repo.remotes(defer.makeNodeResolver());
    return defer.promise.then(function (remotes) {
        assert(remotes.length > 0);
        var remoteOriginUrl = remotes[0].url;
        var owner = gitRemoteParser.getRepositoryOwner(remoteOriginUrl);
        assert(owner, 'Unable to determine user name from remote origin url');
        return owner;
    });
};

TravisGenerator.prototype.getProjectName = function () {
    var defer = q.defer();
    var cwd = process.cwd();
    var repo = new Repo(cwd);
    repo.remotes(defer.makeNodeResolver());
    return defer.promise.then(function (remotes) {
        assert(remotes.length > 0);
        var remoteOriginUrl = remotes[0].url;
        var project = gitRemoteParser.getRepositoryName(remoteOriginUrl);
        assert(project, 'Unable to determine project name from remote origin url');
        return project;
    });
};

TravisGenerator.prototype.isUserOrganizationProject = function () {
    return sequence([
        this.getOwner.bind(this),
        this.getProjectName.bind(this)
    ]).spread(function (owner, projectName) {
        return (projectName === (owner + '.github.io')) || (projectName === (owner + '.github.com'));
    });
};

TravisGenerator.prototype.getSourceBranch = function () {
    return this.isUserOrganizationProject().then(function (isUserOrganizationProject) {
        if (!isUserOrganizationProject) {
            return 'master';
        }
        // if it is a user/org page, we can't develop in master because that is what is deployed
        return this.prompt({
            name: 'destination',
            default: 'development',
            message: 'User & Organization pages build into the master branch. Which branch would you like to develop in?',
        }).then(function (props) {
            return props.destination;
        });
    }.bind(this));
};

TravisGenerator.prototype.getDestinationBranch = function () {
    return this.isUserOrganizationProject().then(function (isUserOrganizationProject) {
        return isUserOrganizationProject ? 'master' : 'gh-pages';
    });
};

TravisGenerator.prototype.getBasicAuthenticatedGitHub = function () {
    return sequence([
        this.getUsername.bind(this),
        this.getPassword.bind(this)
    ]).spread(function (username, password) {
        var github = new GitHubApi({
            // required
            version: '3.0.0',
        });
        github.authenticate({
            type: 'basic',
            username: username,
            password: password
        });
        return github;
    });
};

TravisGenerator.prototype.getTokenAuthenticatedGitHub = function () {
    return sequence([
        this.getGitHubOAuthToken.bind(this)
    ]).spread(function (oauth) {
        var github = new GitHubApi({
            // required
            version: '3.0.0',
        });
        github.authenticate({
            type: 'oauth',
            token: oauth.token
        });
        return github;
    });
};

TravisGenerator.prototype.getGithubOTP = function () {
    return this.prompt({
        name: 'otp',
        message: 'GitHub 2FA One Time Password',
        type: 'password'
    }).then(function (props) {
        return props.otp;
    });
};

TravisGenerator.prototype.getGitHubOAuthToken = function () {
    return sequence([
        this.getBasicAuthenticatedGitHub.bind(this),
        this.getProjectName.bind(this)
    ]).spread(function (github, projectName) {
        var note = projectName + ' (generator-travis-ci) - ' + new Date().toString();
        var noteUrl = require(path.resolve(__dirname, '../package.json')).homepage;

        var createRequest = q.defer();
        github.authorization.create({
            scopes: ['public_repo'],
            note: note,
            note_url: noteUrl
        }, createRequest.makeNodeResolver());
        return createRequest.promise.fail(function (err) {
            // for non two factor auth related errors, just
            // let them bubble up...they're real errors
            if (err.code !== 401) {
                return q.reject(err);
            }
            // we have two factor auth on our hands
            // try to create an oauth token immediately to keep the number of
            // two factor requests to a minimum (1 hopefully)
            return this.getGithubOTP().then(function (otp) {
                var createRequest = q.defer();
                github.authorization.create({
                    headers: {
                        'X-GitHub-OTP': otp
                    },
                    scopes: ['public_repo'],
                    note: note,
                    note_url: noteUrl
                }, createRequest.makeNodeResolver());
                return createRequest.promise;
            });
        }.bind(this));
    }.bind(this));
};


TravisGenerator.prototype.getUsername = function () {
    return sequence([
        this.getOwner.bind(this)
    ]).spread(function (owner) {
        return this.prompt({
            name: 'username',
            message: 'GitHub Username',
            default: owner
        }).then(function (props) {
            return props.username;
        });
    }.bind(this));
};

TravisGenerator.prototype.getPassword = function () {
    return this.prompt({
        name: 'password',
        message: 'GitHub Password',
        type: 'password'
    }).then(function (props) {
        return props.password;
    });
};

TravisGenerator.prototype.getName = function () {
    return sequence([
        this.getTokenAuthenticatedGitHub.bind(this)
    ]).spread(function (github) {
        var defer = q.defer();
        github.user.get({}, defer.makeNodeResolver());
        return defer.promise;
    }).then(function (res) {
        return res.name;
    }.bind(this));
};

TravisGenerator.prototype.getEmail = function () {
    return sequence([
        this.getTokenAuthenticatedGitHub.bind(this)
    ]).spread(function (github) {
        var defer = q.defer();
        github.user.get({}, defer.makeNodeResolver());
        return defer.promise;
    }).then(function (res) {
        return res.email;
    }.bind(this));
};

TravisGenerator.prototype.checkIfTravisGitHubAppAuthorized = function () {
    // basic auth is required for authorization calls,
    // but we need to get the oauth token to make sure we have gotten
    // through 2FA if it is set up
    return sequence([
        this.getBasicAuthenticatedGitHub.bind(this),
        this.getGitHubOAuthToken.bind(this)
    ]).spread(function (github) {
        var getRequest = q.defer();
        github.authorization.getAll({}, getRequest.makeNodeResolver());
        return getRequest.promise.fail(function (err) {
            // for non two factor auth related errors, just
            // let them bubble up...they're real errors
            if (err.code !== 401) {
                return q.reject(err);
            }
            // we have two factor auth on our hands
            // try to create an oauth token immediately to keep the number of
            // two factor requests to a minimum (1 hopefully)
            return this.getGithubOTP().then(function (otp) {
                var getRequest = q.defer();
                github.authorization.getAll({
                    headers: {
                        'X-GitHub-OTP': otp
                    }
                }, getRequest.makeNodeResolver());
                return getRequest.promise;
            });
        }.bind(this)).then(function (res) {
            assert(_.any(res, function (authorization) {
                return authorization.app.name === 'Travis CI' &&
                    authorization.app.url === 'https://travis-ci.org';
            }));
        });
    }.bind(this));
};

TravisGenerator.prototype.showTravisAppAuthorizationSite = function () {
    //the user hasn't authorized the travis-ci app...show them the way
    var url = require('url').format({
        protocol: 'https',
        hostname: 'github.com',
        pathname: '/login/oauth/authorize',
        query: {
            client_id: TRAVIS_CI_GITHUB_CLIENT_ID,
            redirect_uri: 'https://api.travis-ci.org/auth/handshake',
            scope: 'public_repo,user',
            state: 'generator-travis-ci:::https://travis-ci.org/'
        }
    });
    browser(url);
};

TravisGenerator.prototype.waitUntilTravisAppAuthorized = function () {
    //when the user presses a key, check for authorization
    return this.prompt({
        name: 'wait',
        message: 'Redirecting to the GitHub application authorization site. Once Travis CI has been authorized, press any key.'
    }).then(this.checkIfTravisGitHubAppAuthorized.bind(this)).fail(this.waitUntilTravisAppAuthorized.bind(this));
};

TravisGenerator.prototype.ensureTravisAppAuthorized = function () {
    return this.checkIfTravisGitHubAppAuthorized().fail(function () {
        this.showTravisAppAuthorizationSite();
        return this.waitUntilTravisAppAuthorized();
    }.bind(this));
};

TravisGenerator.prototype.revokeGitHubOAuthToken = function () {
    return sequence([
        this.getBasicAuthenticatedGitHub.bind(this),
        this.getGitHubOAuthToken.bind(this)
    ]).spread(function (github, oauth) {
        var deleteRequest = q.defer();
        github.authorization.delete({
            id: oauth.id
        }, deleteRequest.makeNodeResolver());
        return deleteRequest.promise.fail(function (err) {
            // for non two factor auth related errors, just
            // let them bubble up...they're real errors
            if (err.code !== 401) {
                return q.reject(err);
            }
            // we have two factor auth on our hands
            // try to create an oauth token immediately to keep the number of
            // two factor requests to a minimum (1 hopefully)
            return this.getGithubOTP().then(function (otp) {
                var deleteRequest = q.defer();
                github.authorization.delete({
                    headers: {
                        'X-GitHub-OTP': otp
                    },
                    id: oauth.id
                }, deleteRequest.makeNodeResolver());
                return deleteRequest.promise;
            });
        }.bind(this));
    }.bind(this));
};

TravisGenerator.prototype.getAuthenticatedTravis = function () {
    return sequence([
        this.getGitHubOAuthToken.bind(this),
        this.ensureTravisAppAuthorized.bind(this)
    ]).spread(function (oauth) {
        var travis = new Travis({
            version: '2.0.0'
        });

        var authRequest = q.defer();
        travis.auth.github({
            github_token: oauth.token
        }, authRequest.makeNodeResolver());
        return authRequest.promise.then(function (res) {
            var authorizeRequest = q.defer();
            travis.authenticate(res, authorizeRequest.makeNodeResolver());
            return authorizeRequest.promise.thenResolve(travis);
        });
    });
};

TravisGenerator.prototype.setTravisHook = function () {
    return sequence([
        this.getProjectName.bind(this),
        this.getOwner.bind(this),
        this.getAuthenticatedTravis.bind(this)
    ]).spread(function (projectName, owner, travis) {
        return q.resolve().then(function () {
            // get all hooks
            var hooksRequest = q.defer();
            travis.hooks(hooksRequest.makeNodeResolver());
            return hooksRequest.promise;
        }).then(function (res) {
            // find the specific hook associated with this repo
            var hooks = res.hooks;
            var hook = _.find(hooks, function (h) {
                return h.name === projectName && h.owner_name === owner;
            });
            assert(hook);
            return hook;
        }).then(function (hook) {
            // set the hook!
            
            // no need to set the hook if its already set
            if (hook.active) {
                return q.resolve();
            }
            //lets set the hook
            hook.active = true;
            var setHookRequest = q.defer();
            travis.hooks({
                id: hook.id,
                hook: hook
            }, setHookRequest.makeNodeResolver());
            return setHookRequest.promise;
        });
    }.bind(this));
};

TravisGenerator.prototype.ensureTravisRepositoryHookSet = function () {
    return sequence([
        this.getAuthenticatedTravis.bind(this)
    ]).spread(function (travis) {
        var syncRequest = q.defer();
        travis.users.sync(syncRequest.makeNodeResolver());
        return syncRequest.promise.then(function () {
            return untilResolved(this.setTravisHook.bind(this), 3000);
        }.bind(this), this.setTravisHook.bind(this));
    }.bind(this));
};

TravisGenerator.prototype.getEncryptedGitHubOAuthToken = function () {
    return sequence([
        this.getOwner.bind(this),
        this.getProjectName.bind(this),
        this.getAuthenticatedTravis.bind(this),
        this.getGitHubOAuthToken.bind(this)
    ]).spread(function (owner, projectName, travis, oauth) {
        var getKeyRequest = q.defer();
        travis.repos.key({
            owner_name: owner,
            name: projectName
        }, getKeyRequest.makeNodeResolver());
        return getKeyRequest.promise.then(function (res) {
            var pem = res.key.replace(/RSA PUBLIC KEY/g, 'PUBLIC KEY');
            var publicKey = rsa.createPublicKey(pem);
            var msg = 'GH_OAUTH_TOKEN=' + oauth.token;
            var cipherText = publicKey.encrypt(msg, undefined, undefined, rsa.RSA_PKCS1_PADDING);
            return 'secure', '"' + cipherText.toString('base64') + '"';
        });
    });
};

TravisGenerator.prototype.insertReadmeStatusImage = function () {
    return sequence([
        this.getOwner.bind(this),
        this.getProjectName.bind(this)
    ]).spread(function (owner, projectName) {
        var funcs = [];
        _.each(README_TYPES, function (readmeType) {
            var template = readmeType.template;
            _.each(readmeType.extensions, function (extension) {
                var readmePath = path.join(process.cwd(), 'README' + extension);
                if (fs.existsSync(readmePath)) {
                    funcs.push(function () {
                        return this.prompt({
                            name: 'icon',
                            message: 'Append a Travis-CI status icon to README' + extension + '?',
                            default: 'Y/n'
                        }).then(function (props) {
                            if ((/y/i).test(props.icon)) {
                                fs.appendFileSync(readmePath, _.template(template, {
                                    owner: owner,
                                    projectName: projectName
                                }));
                            }
                        }.bind(this));
                    }.bind(this));
                }
            }, this);
        }, this);
        if (funcs.length === 0) {
            funcs.push(function () {
                return this.prompt({
                    name: 'icon',
                    message: 'Create a README.markdown file containing a Travis-CI status icon?',
                    default: 'Y/n'
                }).then(function (props) {
                    if ((/y/i).test(props.icon)) {
                        var readmePath = path.join(process.cwd(), 'README.markdown');
                        fs.appendFileSync(readmePath, _.template(README_TYPES.markdown.template, {
                            owner: owner,
                            projectName: projectName
                        }));
                    }
                }.bind(this));
            }.bind(this));
        }
    });
};