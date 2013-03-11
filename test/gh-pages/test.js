/*global describe beforeEach it*/

var path    = require('path');
var helpers = require('yeoman-generator').test;
var nconf = require('nconf');
nconf.env().file({ file: '.env' });

var username = nconf.get('GH_USERNAME');
var password = nconf.get('GH_PASSWORD');

describe('travis-ci:gh-pages generator test', function () {
    this.timeout(0);

    beforeEach(function (done) {
        helpers.testDirectory(path.join(__dirname, 'temp'), function (err) {
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

        var generator;
        generator = helpers.createGenerator('travis-ci:gh-pages', [
            '../../../gh-pages', [
                helpers.createDummyGenerator(),
                'mocha:app'
            ]
        ]);

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
