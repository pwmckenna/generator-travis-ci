var path    = require('path');
var generators = require('yeoman-generator');
var helpers = generators.test;

var cwd = path.join(__dirname, 'temp');

describe('travis-ci:gh-pages generator test', function () {
    beforeEach(function (done) {
        helpers.testDirectory(cwd, function (err) {
            if (err) {
                return done(new Error(err));
            }

            this.generator = helpers.createGenerator('travis-ci:gh-pages', [
                '../../../gh-pages'
            ]);

            // Use the username and password that we loaded either from .env or env variables,
            // rather than providing them via stdin.
            helpers.mockPrompt(this.generator, {
                'username': process.env.GH_USERNAME,
                'password': process.env.GH_PASSWORD,
                'icon': 'Y',
                'destination': 'development'
            });

            done();
        }.bind(this));
    });

    afterEach(function (done) {
        this.generator.revokeGitHubOAuthToken().then(function () {
            done();
        }, function (err) {
            done(new Error(err));
        });
    });

    it('creates expected .travis.yml file', function (done) {
        this.timeout(15000);

        helpers.stub(this.generator, 'repositoryInformation', function () {
            this.generator.set('owner', 'pwmckenna');
            this.generator.set('projectName', 'generator-travis-ci');
        }.bind(this));

        this.generator.run({}, function () {
            // For now, just check that the file exists.
            helpers.assertFiles(['.travis.yml']);
            done();
        }.bind(this));
    });

    it('creates expected .travis.yml file for a *.github.io user page', function (done) {
        this.timeout(15000);

        helpers.stub(this.generator, 'repositoryInformation', function () {
            this.generator.set('owner', 'pwmckenna');
            this.generator.set('projectName', 'pwmckenna.github.io');
        }.bind(this));

        this.generator.run({}, function () {
            // For now, just check that the file exists.
            helpers.assertFiles(['.travis.yml']);
            done();
        }.bind(this));
    });
});
