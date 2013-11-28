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

        .then(this.initializeGitHubApi.bind(this))
        .then(this.celebrate('Initialize GitHub Api'), this.mourn('Initialize GitHub Api'))

        .then(this.initializeTravisApi.bind(this))
        .then(this.celebrate('Initialize Travis-ci Api'), this.mourn('Initialize Travis-ci Api'))

        .then(this.repositoryInformation.bind(this))
        .then(this.celebrate('Query Repository Information'), this.mourn('Query Repository Information'))

        .then(this.setSourceBranch.bind(this))
        .then(this.celebrate('Set Source Branch'), this.mourn('Set Source Branch'))

        .then(this.setDestinationBranch.bind(this))
        .then(this.celebrate('Set Destination Branch'), this.mourn('Set Destination Branch'))

        .then(this.gitHubLogin.bind(this))
        .then(this.celebrate('Login to GitHub Api'), this.mourn('Login to GitHub Api'))

        .then(this.gitHubUserInfo.bind(this))
        .then(this.celebrate('Query GitHub User Information'), this.mourn('Query GitHub User Information'))

        .then(this.ensureTravisAppAuthorized.bind(this))
        .then(this.celebrate('Ensure GitHub Travis App Authorized'), this.mourn('Ensure GitHub Travis App Authorized'))

        .then(this.generateGitHubOAuthToken.bind(this))
        .then(this.celebrate('Generate GitHub OAuth Token'), this.mourn('Generate GitHub OAuth Token'))

        .then(this.travisGitHubAuthentication.bind(this))
        .then(this.celebrate('Login to Travis-ci Api'), this.mourn('Login to Travis-ci Api'))

        .then(this.ensureTravisRepositoryHookSet.bind(this))
        .then(this.celebrate('Ensure Travis Repository Hook Set'), this.mourn('Ensure Travis Repository Hook Set'))

        .then(this.insertReadmeStatusImage.bind(this))
        .then(this.celebrate('Readme Build Status Image'), this.mourn('Readme Build Status Image'))

        .then(this.encryptGitHubOAuthToken.bind(this))
        .then(this.celebrate('Encrypt GitHub OAuth Token'), this.mourn('Encrypt GitHub OAuth Token'))

        .then(function () {
            try {
                assert(this.has('secure'), 'encrypted oauth token unavailable');
                assert(this.has('owner'), 'owner not determined');
                assert(this.has('projectName'), 'project name not determined');
                assert(this.has('email'), 'user email unavailable');
                assert(this.has('name'), 'user\'s full name unavailable');

                this.directory('.', '.');
                this.template('_.travis.yml', '.travis.yml', {
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
