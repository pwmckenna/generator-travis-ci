/*global describe beforeEach it*/

var path    = require('path');
var generators = require('yeoman-generator');
var helpers = generators.test;
var q = require('q');
var proxyquire = require('proxyquire');
var assert = require('assert');

var nconf = require('nconf');
nconf.env().file({
    file: '.env'
});
var username = nconf.get('GH_USERNAME');
var password = nconf.get('GH_PASSWORD');
var cwd = path.join(__dirname, 'temp');

describe('travis-ci:gh-pages generator test', function () {
    this.timeout(0);

    beforeEach(function (done) {
        helpers.testDirectory(cwd, function (err) {
            if (err) {
                return done(err);
            }
            done();
        }.bind(this));
    });

    it('the generator can be required without throwing', function () {
        //test that there is a generator index.js file
        require('../../gh-pages');
    });

    it('creates expected .travis.yml file', function (done) {
        this.timeout(15000);

        var TravisGhPagesGenerator = proxyquire('../../gh-pages/', {
            './lib/git-config': {
                'get': function(key) {
                    assert(key === 'remote.origin.url', 'invalid git config get request');
                    return q.resolve('git@github.com:pwmckenna/generator-travis-ci.git');
                }
            }
        });
        var generator = new TravisGhPagesGenerator([], {
            env: {},
            name: 'gh-pages',
            resolved: path.join(__dirname, '../../gh-pages/index.js')
        });
        helpers.mockPrompt(generator, {
            'username': username,
            'password': password
        });
        generator.run({}, function () {
            helpers.assertFiles(['.travis.yml']);
            done();
        });
    });
});
