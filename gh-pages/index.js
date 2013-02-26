//published dependencies
var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');
//local dependencies
var gitconfig = require('./lib/git-config');
var gitoauth = require('./lib/github-oauth');
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

Generator.prototype.askFor = function () {
    var cb = this.async();

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

        this.userName = userName;
        this.projectName = projectName;
        this.directory('.', '.');

        //curl -u 'username' -d '{"scopes":["repo"],"note":"push to gh-pages from travis"}' https://api.github.com/authorizations

        // - secure: <%=  secure %> # "PqA7vqn4A2OpI3Nj6RQYfDKINNBkoRVRsazkZfQPVqCgp6shJ65XXdp66eOT\nIpiVwms4aLAW1TWuMJbn5p3nBhqxkueKZtv8KIrB6Ho+MvRoC2P3S4sv7HJG\nDjA9K1+2H+neLn7kDdFIW42LtCPrAUgVoW0ixNH6gn8Ikf/CZig="
        // # User specific env variables
        // - GH_USER_NAME: <%= userName %> # pwmckenna
        // - GH_PROJECT_NAME: <%= projectName %> # mduel
        var oauth = gitoauth.generate.bind(this, this.userName);
        var encrypt = travis.encrypt.bind(this, this.userName, this.projectName);
        var generate = function (secure) {
            console.log('generate', secure);
            this.secure = secure;
            _.templateSettings['interpolate'] = /{{([\s\S]+?)}}/g;
            this.template('.travis.yml', '.travis.yml', this);
        }.bind(this);

        var chain = oauth().then(encrypt).then(generate);
        chain.done(cb);
        chain.fail(cb);
    }.bind(this), cb);
};
