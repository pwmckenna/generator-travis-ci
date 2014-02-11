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

var DEFAULT_SUBAPP = 'travis-ci:default    (runs `grunt` on Travis-CI so you know when your build is passing)';
var GH_PAGES_SUBAPP = 'travis-ci:gh-pages   (runs `grunt` on Travis-CI and deploys the build to your GitHub Pages branch)';

Generator.prototype.askFor = function () {
    var done = this.async();
    this.displayLogo();

    this.prompt({
        type: 'list',
        name: 'list',
        message: 'What would you like Travis to do for you?',
        choices: [
            DEFAULT_SUBAPP,
            GH_PAGES_SUBAPP
        ]
    }).then(function (props) {
        if (props.list === DEFAULT_SUBAPP) {
            this.generatorName = 'travis-ci:default';
        } else if (props.list === GH_PAGES_SUBAPP) {
            this.generatorName = 'travis-ci:gh-pages';
        }
        done();
    }.bind(this)).fail(function (err) {
        done(new Error(err));
    });
};

Generator.prototype.main = function () {
    this.invoke(this.generatorName, {
        options: {
            nested: true,
            appName: this.appName
        }
    });
};