var assert = require('assert');
var TravisGenerator = require('../lib/travis-generator');
var path = require('path');
var util = require('util');
var q = require('q');

module.exports = Generator;

function Generator() {
    TravisGenerator.apply(this, arguments);
    this.appname = path.basename(process.cwd());
    this.desc('This generator creates a .travis.yml that tells travis-ci to build your yeoman project and push the build to your gh-pages branch, on every commit to master.');
}

util.inherits(Generator, TravisGenerator);

Generator.prototype.writeDotTravisFile = function () {
    var done = this.async();
    this.displayLogo()

        .then(function () {
            return this.initializeGitHubApi()
                .then(this.celebrate('Initialize GitHub Api'), this.mourn('Initialize GitHub Api'));
        }.bind(this))

        .then(function () {
            return this.initializeTravisApi()
                .then(this.celebrate('Initialize Travis-ci Api'), this.mourn('Initialize Travis-ci Api'));
        }.bind(this))

        .then(function () {
            return this.repositoryInformation()
                .then(this.celebrate('Query Repository Information'), this.mourn('Query Repository Information'));
        }.bind(this))

        .then(function () {
            return this.setSourceBranch()
                .then(this.celebrate('Set Source Branch'), this.mourn('Set Source Branch'));
        }.bind(this))

        .then(function () {
            return this.setDestinationBranch()
                .then(this.celebrate('Set Destination Branch'), this.mourn('Set Destination Branch'));
        }.bind(this))

        .then(function () {
            return this.gitHubLogin()
                .then(this.celebrate('Login to GitHub Api'), this.mourn('Login to GitHub Api'));
        }.bind(this))

        .then(function () {
            return this.gitHubUserInfo()
                .then(this.celebrate('Query GitHub User Information'), this.mourn('Query GitHub User Information'));
        }.bind(this))

        .then(function () {
            return this.ensureTravisAppAuthorized()
                .then(this.celebrate('Ensure GitHub Travis App Authorized'), this.mourn('Ensure GitHub Travis App Authorized'));
        }.bind(this))

        .then(function () {
            return this.generateGitHubOAuthToken()
                .then(this.celebrate('Generate GitHub OAuth Token'), this.mourn('Generate GitHub OAuth Token'));
        }.bind(this))

        .then(function () {
            return this.travisGitHubAuthentication()
                .then(this.celebrate('Login to Travis-ci Api'), this.mourn('Login to Travis-ci Api'));
        }.bind(this))

        .then(function () {
            return this.ensureTravisRepositoryHookSet()
                .then(this.celebrate('Ensure Travis Repository Hook Set'), this.mourn('Ensure Travis Repository Hook Set'));
        }.bind(this))

        .then(function () {
            return this.insertReadmeStatusImage()
                .then(this.celebrate('Readme Build Status Image'), this.mourn('Readme Build Status Image'));
        }.bind(this))

        .then(function () {
            return this.encryptGitHubOAuthToken()
                .then(this.celebrate('Encrypt GitHub OAuth Token'), this.mourn('Encrypt GitHub OAuth Token'));
        }.bind(this))

        .then(function () {
            try {
                assert(this.has('secure'), 'encrypted oauth token unavailable');
                assert(this.has('owner'), 'owner not determined');
                assert(this.has('projectName'), 'project name not determined');
                assert(this.has('email'), 'user email unavailable');
                assert(this.has('name'), 'user\'s full name unavailable');

                this.directory('.', '.');
                this.template('.travis.yml', '.travis.yml', {
                    sourceBranch: this.get('sourceBranch'),
                    destinationBranch: this.get('destinationBranch'),
                    oauth: this.get('githubOAuthAuthorization').token,
                    secure: this.get('secure'),
                    owner: this.get('owner'),
                    projectName: this.get('projectName'),
                    email: this.get('email'),
                    name: this.get('name')
                });
                return q.resolve();
            } catch (err) {
                return q.reject(err);
            }
        }.bind(this))
        .then(this.celebrate('Write Travis Configuration File'), this.mourn('Write Travis Configuration File'))

        .then(function () {
            done();
        }.bind(this), function (err) {
            done(new Error(err));
        });
};
