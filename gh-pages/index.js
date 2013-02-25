//published dependencies
var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');
var q = require('q');
//local dependencies
var gitconfig = require('./lib/git-config');
var gitoauth = require('./lib/github-oauth');
var travis = require('./lib/travis');


var parseProjectNameFromRemoteOriginalUrl = function (remoteOriginUrl) {
    return remoteOriginUrl;
};

var parseUserNameFromRemoteOriginUrl = function (remoteOriginUrl) {
    return remoteOriginUrl;
};


module.exports = Generator;

function Generator() {
    yeoman.generators.Base.apply(this, arguments);
    this.appname = path.basename(process.cwd());
    this.desc('This generator creates a .travis.yml that tells travis-ci to build your yeoman project and push the build to your gh-pages branch, on every commit to master.');
}

util.inherits(Generator, yeoman.generators.Base);

Generator.prototype.askFor = function () {
    var cb = this.async();

    // Welcome message
    var logo = '\n' +
    '\n   ╔══════════════════════════════════╗'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤'.red + '╔══════════════════════╗'.white + '¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤'.red + '║ '.white + '╔══════════════════╗'.red + ' ║'.white + '¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤'.red + '║ '.white + '║ ╔═════╗  ╔═════╗ ║'.red + ' ║'.white + '¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤'.red + '║ '.white + '╚═╝'.red + ' ╔═╗ '.white + '║  ║'.red + ' ╔═╗ '.white + '╚═╝'.red + ' ║'.white + '¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤'.red + '╚═════╝'.white + '¤'.red + '║ '.white + '║  ║'.red + ' ║'.white + '¤'.red + '╚═════╝'.white + '¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '║  ║'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '║  ║'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '║  ║'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '║  ║'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red + '╔╝ '.white + '║  ║'.red + ' ╚╗'.white + '¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '╔╝  ╚╗'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red + '║ '.white + '╚════╝'.red + ' ║'.white + '¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red + '╚════════╝'.white + '¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red +
    '\n   ╚══════════════════════════════════╝'.red +
    '\n\n';

    console.log(logo);

    var configRequest = q.all([
        gitconfig.get('remote.origin.url'),
        gitconfig.get('user.name'),
        gitconfig.get('user.email')
    ]);
    configRequest.spread(function (remoteOriginUrl, name, email) {
        console.log(remoteOriginUrl, name, email);
        //curl -u 'username' -d '{"scopes":["repo"],"note":"push to gh-pages from travis"}' https://api.github.com/authorizations

        // - secure: <%=  secure %> # "PqA7vqn4A2OpI3Nj6RQYfDKINNBkoRVRsazkZfQPVqCgp6shJ65XXdp66eOT\nIpiVwms4aLAW1TWuMJbn5p3nBhqxkueKZtv8KIrB6Ho+MvRoC2P3S4sv7HJG\nDjA9K1+2H+neLn7kDdFIW42LtCPrAUgVoW0ixNH6gn8Ikf/CZig="
        // # User specific env variables
        // - GH_USER_NAME: <%= userName %> # pwmckenna
        // - GH_PROJECT_NAME: <%= projectName %> # mduel
        // - GH_FULL_NAME: <%= fullName %> # Patrick Williams
        // - GH_EMAIL: <%= email %> #pwmckenna@gmail.com
        this.userName = parseUserNameFromRemoteOriginUrl(remoteOriginUrl);
        this.projectName = parseProjectNameFromRemoteOriginalUrl(remoteOriginUrl);
        this.fullName = name;
        this.email = email;
        this.directory('.', '.');

        var oauth = gitoauth.generate.bind(this, this.userName);
        var encrypt = travis.encrypt.bind(this, this.userName, this.projectName);
        var generate = function (secure) {
            this.secure = secure;
            this.template('.travis.yml', '.travis.yml', this);
        }.bind(this);

        var chain = oauth().then(encrypt).then(generate);
        chain.done(cb);
        chain.fail(cb);
    }.bind(this));
    configRequest.fail(cb);
};
