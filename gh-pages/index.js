var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');
var spawn = require('child_process').spawn;

function generateOAuthToken(user, success, error) {
  console.log('Github OAuth'.bold);
  console.log('To deploy to your gh-pages branch, travis must be granted a github oauth token.');
  console.log('Executing'.bold + ': ' + 'curl -u \'' + user + '\' -d \'{"scopes":["public_repo"],"note":"push to gh-pages from travis"}\' https://api.github.com/authorizations'.grey);

  var token = null;

  var curlargs = [
    '-u', 
    user, 
    '-d', 
    '{"scopes":["public_repo"],"note":"push to gh-pages from travis-ci"}', 
    'https://api.github.com/authorizations'
  ];
  var ls = spawn('curl', curlargs);

  ls.stdout.on('data', function (data) {
    var payload = JSON.parse(''+data);
    if(payload && payload.hasOwnProperty('token')) {
      if(typeof payload.token === 'string' && payload.token.length === 40) {
        console.log('\n\ngithub oauth token generation...' + 'success'.green.bold + '\n\n');
        token = payload.token;
      } else {
        console.log('invalid github oauth token!'.red);
      }
    } else {
      console.log('github oauth token generation request failed'.red);
    }
  });

  ls.stderr.on('data', function(data) {
    var err = '' + data;
    if(err.indexOf('password') !== -1) {
      console.log(err);
    }
  });

  ls.on('exit', function (code) {
    if(token) {
      success(token);
    } else {
      error();
    }
  });
}

function encryptOAuthToken(token, username, projectname, success, error) {
  console.log('Encrypting OAuth Token'.bold);
  console.log('To prevent your oauth token from being visible in travis-ci logs, it must be encrypted using the `travis` gem.');
  console.log('Executing'.bold + ': ' + 'travis encrypt GH_OAUTH_TOKEN=****************************************')
  console.log('\n\ngithub oauth token encryption...' + 'success'.green.bold + '\n\n');

  var secure = null;

  var travisargs = [
    'encrypt', 
    '-r',
    username + '/' + projectname,
    token
  ];
  var travis = spawn('travis', travisargs);

  travis.stdout.on('data', function (data) {
    secure = '' + data;
  });

  travis.stderr.on('data', function (data) {
    var err = '' + data;
    console.log(err);
  });

  travis.on('exit', function (code) {
    if(secure) {
      success(secure);
    } else {
      error();
    }
  });
}

module.exports = Generator;

function Generator() {
  yeoman.generators.Base.apply( this, arguments );
  this.appname = path.basename(process.cwd());
  this.desc('This generator creates a .travis.yml that tells travis-ci to build your yeoman project and push the build to your gh-pages branch, on every commit to master.');
}

util.inherits( Generator, yeoman.generators.Base );

Generator.prototype.askFor = function askFor( argument ) {
  var cb = this.async();

  // Welcome message
  var logo = '\n'+
  '\n   ╔══════════════════════════════════╗'.red+
  '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤'.red+'╔══════════════════════╗'.white+'¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤'.red+'║ '.white+'╔══════════════════╗'.red+' ║'.white+'¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤'.red+'║ '.white+'║ ╔═════╗  ╔═════╗ ║'.red+' ║'.white+'¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤'.red+'║ '.white+'╚═╝'.red+' ╔═╗ '.white+'║  ║'.red+' ╔═╗ '.white+'╚═╝'.red+' ║'.white+'¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤'.red+'╚═════╝'.white+'¤'.red+'║ '.white+'║  ║'.red+' ║'.white+'¤'.red+'╚═════╝'.white+'¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'║  ║'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'║  ║'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'║  ║'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'║  ║'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red+'╔╝ '.white+'║  ║'.red+' ╚╗'.white+'¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'╔╝  ╚╗'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'╚════╝'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤'.red+'╚════════╝'.white+'¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n   ║¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n   ╚══════════════════════════════════╝'.red+
  '\n\n';

  console.log(logo);

  // var git = require('./lib/git');
  // var remoteOriginUrlRequest = git.config.get('remote.origin.url');
  // var userNameRequest = git.config.get('user.name');
  // var emailRequest = git.config.get('user.email');

  var prompts = [
	  {
	    name: 'userName',
	    message: 'GitHub User Name',
	    default: 'pwmckenna',
	    warning: 'warning'
	  },
	  {
	  	name: 'projectName',
	  	message: 'GitHub Project Name',
	  	default: 'mduel',
	  	warning: 'warning'
	  },
	  {
	  	name: 'fullName',
	  	message: 'Full Name',
	  	default: 'Patrick Williams',
	  	warning: 'warning'
	  },
	  {
	  	name: 'email',
	  	message: 'Email',
	  	default: 'pwmckenna@gmail.com',
	  	warning: 'warning'
	  }
  ];

  this.prompt( prompts, function( err, props ) {
    if ( err ) {
      return this.emit( 'error', err );
    }

  	//curl -u 'username' -d '{"scopes":["repo"],"note":"push to gh-pages from travis"}' https://api.github.com/authorizations    

    // - secure: <%=  secure %> # "PqA7vqn4A2OpI3Nj6RQYfDKINNBkoRVRsazkZfQPVqCgp6shJ65XXdp66eOT\nIpiVwms4aLAW1TWuMJbn5p3nBhqxkueKZtv8KIrB6Ho+MvRoC2P3S4sv7HJG\nDjA9K1+2H+neLn7kDdFIW42LtCPrAUgVoW0ixNH6gn8Ikf/CZig="
    // # User specific env variables
    // - GH_USER_NAME: <%= userName %> # pwmckenna
    // - GH_PROJECT_NAME: <%= projectName %> # mduel
    // - GH_FULL_NAME: <%= fullName %> # Patrick Williams 
    // - GH_EMAIL: <%= email %> #pwmckenna@gmail.com
    this.userName = props.userName;
    this.projectName = props.projectName;
    this.fullName = props.fullName;
    this.email = props.email;
    this.directory( '.', '.' );
    
    generateOAuthToken(this.userName, function(token) {
        encryptOAuthToken(token, this.userName, this.projectName, function(secure) {
            this.secure = secure;
            this.template( '.travis.yml', '.travis.yml', this );
            cb();
          }.bind ( this ), cb
        );
      }.bind( this ), cb
    );
  }.bind( this ));
};