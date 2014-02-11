var TravisGenerator = require('../lib/travis-generator');
var path = require('path');
var util = require('util');
var sequence = require('../lib/sequence');

module.exports = Generator;

function Generator() {
    TravisGenerator.apply(this, arguments);
    this.appname = path.basename(process.cwd());
    this.desc('This generator creates a .travis.yml that tells travis-ci to build your yeoman project and push the build to your gh-pages branch, on every commit to master.');
}

util.inherits(Generator, TravisGenerator);

Generator.prototype.writeDotTravisFile = function () {
    var done = this.async();
    this.displayLogo();
    sequence([
        this.getSourceBranch.bind(this),
        this.getDestinationBranch.bind(this),
        this.getOwner.bind(this),
        this.getProjectName.bind(this),
        this.getEmail.bind(this),
        this.getName.bind(this),
        this.getGitHubOAuthToken.bind(this),
        this.getEncryptedGitHubOAuthToken.bind(this),
    ]).spread(function (sourceBranch, destinationBranch, owner, projectName, email, name, oauth, secure) {
        this.directory('.', '.');
        this.template('.travis.yml', '.travis.yml', {
            sourceBranch: sourceBranch,
            destinationBranch: destinationBranch,
            oauth: oauth.token,
            secure: secure,
            owner: owner,
            projectName: projectName,
            email: email,
            name: name
        });
    }.bind(this)).then(function () {
        done();
    }.bind(this)).fail(function (err) {
        done(new Error(err));
    });
};
