var path    = require('path');
var generators = require('yeoman-generator');
var helpers = generators.test;

var cwd = path.join(__dirname, 'temp');

describe('travis-ci generator test', function () {
    beforeEach(function (done) {
        helpers.testDirectory(cwd, function (err) {
            if (err) {
                return done(new Error(err));
            }

            this.generator = helpers.createGenerator('travis-ci:app', [
                '../../../app'
            ]);

            // Use the username and password that we loaded either from .env or env variables,
            // rather than providing them via stdin.
            helpers.mockPrompt(this.generator, {
                'username': process.env.GH_USERNAME,
                'password': process.env.GH_PASSWORD,
                'icon': 'Y'
            });

            done();
        }.bind(this));
    });

    it('creates expected .travis.yml file', function (done) {
        // There are a bunch of api calls to github/travis/heroku,
        // so give it a bit longer that the default
        this.timeout(15000);

        helpers.stub(this.generator, 'repositoryInformation', function () {
            this.generator.set('owner', 'pwmckenna');
            this.generator.set('projectName', 'generator-travis-ci');
        }.bind(this));

        this.generator.run({}, function () {
            helpers.assertFiles(['.travis.yml']);
            done();
        });
    });
});
