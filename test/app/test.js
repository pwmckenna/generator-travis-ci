/*global describe beforeEach it*/

var path    = require('path');
var generators = require('yeoman-generator');
var helpers = generators.test;
var q = require('q');
var proxyquire = require('proxyquire');
var assert = require('assert');


// We need to be able to specify username and password in a ignored .env file locally,
// but on travis, we need to load
var nconf = require('nconf');
nconf.env().file({
    file: '.env'
});
var username = nconf.get('GH_USERNAME');
var password = nconf.get('GH_PASSWORD');

assert(username, 'github username (GH_USERNAME) must be specified, either in a .env file or as an env variable to run this test.');
assert(password, 'github password (GH_PASSWORD) must be specified, either in a .env file or as an env variable to run this test.');



var cwd = path.join(__dirname, 'temp');

describe('travis-ci generator test', function () {
    this.timeout(0);

    beforeEach(function (done) {
        helpers.testDirectory(cwd, function (err) {
            if (err) {
                return done(err);
            }
            done();
        }.bind(this));
    });

    // This just tests that there is a file that
    it('the generator can be required without throwing', function () {
        //test that there is a generator index.js file
        var TravisAppGenerator = require('../../app');
        assert(TravisAppGenerator, 'the app module does not export anything');
    });

    it('creates expected .travis.yml file', function (done) {
        // There are a bunch of api calls to github/travis/heroku,
        // so give it a bit longer that the default
        this.timeout(15000);

        // We already know the path of our generator package,
        // so we can create it directly...this also allows us to
        // use proxyrequire to stub out functionality
        // In this case, we're stubbing out the local
        // `git config get remote.origin.url`,
        // as this will fail on travis boxes
        var TravisAppGenerator = proxyquire('../../app/', {
            '../lib/travis-generator': proxyquire('../../lib/travis-generator', {
                './git-config': {
                    'get': function (key) {
                        assert(key === 'remote.origin.url', 'invalid git config get request');
                        return q.resolve('git@github.com:pwmckenna/generator-travis-ci.git');
                    }
                }
            })
        });

        // We need to provide a few arguments that yo would generally provide to our generator.
        // This seems to be the minimal set to keep the Base Generator class happy
        var generator = new TravisAppGenerator([], {
            env: {},
            name: 'app',
            resolved: path.join(__dirname, '../../app/index.js')
        });

        // Use the username and password that we loaded either from .env or env variables,
        // rather than providing them via stdin.
        helpers.mockPrompt(generator, {
            'username': username,
            'password': password
        });
        generator.run({}, function () {
            // For now, just check that the file exists.
            helpers.assertFiles(['.travis.yml']);
            done();
        });
    });
});
