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
    if (!this.options.nested) {
        this.displayLogo();
    }

    var done = this.async();
    sequence([
        this.ensureTravisRepositoryHookSet.bind(this),
        this.insertReadmeStatusImage.bind(this),
        this.revokeGitHubOAuthToken.bind(this)
    ]).then(function () {
        this.template(path.resolve(__dirname, './templates/_travis.yml'), '.travis.yml', {});
    }.bind(this)).then(function () {
        done();
    }).fail(function (err) {
        done(new Error(err));
    });
};
