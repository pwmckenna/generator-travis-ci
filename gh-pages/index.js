var assert = require('assert');
var TravisGenerator = require('../lib/travis-generator');
var path = require('path');
var util = require('util');

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
        .then(this.celebrate.bind(this, 'Initialize GitHub Api'), this.mourn.bind(this, 'Initialize GitHub Api'))

        .then(this.initializeTravisApi.bind(this))
        .then(this.celebrate.bind(this, 'Initialize Travis-ci Api'), this.mourn.bind(this, 'Initialize Travis-ci Api'))

        .then(this.repositoryInformation.bind(this))
        .then(this.celebrate.bind(this, 'Query Repository Information'), this.mourn.bind(this, 'Query Repository Information'))

        .then(this.gitHubLogin.bind(this))
        .then(this.celebrate.bind(this, 'Login to GitHub Api'), this.mourn.bind(this, 'Login to GitHub Api'))

        .then(this.gitHubUserInfo.bind(this))
        .then(this.celebrate.bind(this, 'Query GitHub User Information'), this.mourn.bind(this, 'Query GitHub User Information'))

        .then(this.ensureTravisAppAuthorized.bind(this))
        .then(this.celebrate.bind(this, 'Ensure GitHub Travis App Authorized'), this.mourn.bind(this, 'Ensure GitHub Travis App Authorized'))

        .then(this.generateGitHubOAuthToken.bind(this))
        .then(this.celebrate.bind(this, 'Generate GitHub OAuth Token'), this.mourn.bind(this, 'Generate GitHub OAuth Token'))

        .then(this.travisGitHubAuthentication.bind(this))
        .then(this.celebrate.bind(this, 'Login to Travis-ci Api'), this.mourn.bind(this, 'Login to Travis-ci Api'))

        .then(this.ensureTravisRepositoryHookSet.bind(this))
        .then(this.celebrate.bind(this, 'Ensure Travis Repository Hook Set'), this.mourn.bind(this, 'Ensure Travis Repository Hook Set'))

        .then(this.encryptGitHubOAuthToken.bind(this))
        .then(this.celebrate.bind(this, 'Encrypt GitHub OAuth Token'), this.mourn.bind(this, 'Encrypt GitHub OAuth Token'))

        .then(function () {
            assert(this.has('secure'), 'encrypted oauth token unavailable');
            assert(this.has('owner'), 'owner not determined');
            assert(this.has('projectName'), 'project name not determined');
            assert(this.has('email'), 'user email unavailable');
            assert(this.has('name'), 'user\'s full name unavailable');

            this.directory('.', '.');
            this.template('.travis.yml', '.travis.yml', {
                oauth: this.get('githubOAuthAuthorization').token,
                secure: this.get('secure'),
                owner: this.get('owner'),
                projectName: this.get('projectName'),
                email: this.get('email'),
                name: this.get('name')
            });
            done();
        }.bind(this), function (err) {
            done(err);
        });
};
