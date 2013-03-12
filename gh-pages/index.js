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
    this._displayLogo()

        .then(this._initializeGitHubApi.bind(this))
        .then(this._celebrate.bind(this, 'Initialize GitHub Api'), this._mourn.bind(this, 'Initialize GitHub Api'))

        .then(this._initializeTravisApi.bind(this))
        .then(this._celebrate.bind(this, 'Initialize Travis-ci Api'), this._mourn.bind(this, 'Initialize Travis-ci Api'))

        .then(this._repositoryInformation.bind(this))
        .then(this._celebrate.bind(this, 'Query Repository Information'), this._mourn.bind(this, 'Query Repository Information'))

        .then(this._gitHubLogin.bind(this))
        .then(this._celebrate.bind(this, 'Login to GitHub Api'), this._mourn.bind(this, 'Login to GitHub Api'))

        .then(this._gitHubUserInfo.bind(this))
        .then(this._celebrate.bind(this, 'Query GitHub User Information'), this._mourn.bind(this, 'Query GitHub User Information'))

        .then(this._ensureTravisAppAuthorized.bind(this))
        .then(this._celebrate.bind(this, 'Ensure GitHub Travis App Authorized'), this._mourn.bind(this, 'Ensure GitHub Travis App Authorized'))

        .then(this._generateGitHubOAuthToken.bind(this))
        .then(this._celebrate.bind(this, 'Generate GitHub OAuth Token'), this._mourn.bind(this, 'Generate GitHub OAuth Token'))

        .then(this._travisGitHubAuthentication.bind(this))
        .then(this._celebrate.bind(this, 'Login to Travis-ci Api'), this._mourn.bind(this, 'Login to Travis-ci Api'))

        .then(this._ensureTravisRepositoryHookSet.bind(this))
        .then(this._celebrate.bind(this, 'Ensure Travis Repository Hook Set'), this._mourn.bind(this, 'Ensure Travis Repository Hook Set'))

        .then(this._encryptGitHubOAuthToken.bind(this))
        .then(this._celebrate.bind(this, 'Encrypt GitHub OAuth Token'), this._mourn.bind(this, 'Encrypt GitHub OAuth Token'))

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
