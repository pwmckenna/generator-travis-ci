var path = require('path');
var util = require('util');
var yeoman = require('../../../../');

module.exports = Generator;

function Generator() {
  yeoman.generators.Base.apply( this, arguments );
  this.appname = 'travis-ci';
  this.desc('This generator creates a .travis.yml that tells travis-ci to build your yeoman project and push the build to your gh-pages branch, on every commit to master.');
}

util.inherits( Generator, yeoman.generators.NamedBase );

Generator.prototype.askFor = function askFor( argument ) {
  var cb = this.async();

  // Welcome message
  var logo = ''+
  '\n╔════════════════════════════════╗'.red+
  '\n║¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n║¤¤¤¤'.red+'╔══════════════════════╗'.white+'¤¤¤¤║'.red+
  '\n║¤¤¤¤'.red+'║ '.white+'╔══════════════════╗'.red+' ║'.white+'¤¤¤¤║'.red+
  '\n║¤¤¤¤'.red+'║ '.white+'║ ╔═════╗  ╔═════╗ ║'.red+' ║'.white+'¤¤¤¤║'.red+
  '\n║¤¤¤¤'.red+'║ '.white+'╚═╝'.red+' ╔═╗ '.white+'║  ║'.red+' ╔═╗ '.white+'╚═╝'.red+' ║'.white+'¤¤¤¤║'.red+
  '\n║¤¤¤¤'.red+'╚═════╝'.white+'¤'.red+'║ '.white+'║  ║'.red+' ║'.white+'¤'.red+'╚═════╝'.white+'¤¤¤¤║'.red+
  '\n║¤¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'║  ║'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n║¤¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'║  ║'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n║¤¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'║  ║'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n║¤¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'║  ║'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n║¤¤¤¤¤¤¤¤¤¤¤'.red+'╔╝ '.white+'║  ║'.red+' ╚╗'.white+'¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n║¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'╔╝  ╚╗'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n║¤¤¤¤¤¤¤¤¤¤¤'.red+'║ '.white+'╚════╝'.red+' ║'.white+'¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n║¤¤¤¤¤¤¤¤¤¤¤'.red+'╚════════╝'.white+'¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n║¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤║'.red+
  '\n╚════════════════════════════════╝'.red;

  console.log(logo);

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

    var secure = "\"PqA7vqn4A2OpI3Nj6RQYfDKINNBkoRVRsazkZfQPVqCgp6shJ65XXdp66eOT\nIpiVwms4aLAW1TWuMJbn5p3nBhqxkueKZtv8KIrB6Ho+MvRoC2P3S4sv7HJG\nDjA9K1+2H+neLn7kDdFIW42LtCPrAUgVoW0ixNH6gn8Ikf/CZig=\"";

    this.secure = secure;
    this.userName = props.userName;
    this.projectName = props.projectName;
    this.fullName = props.fullName;
    this.email = props.email;
    console.log(this, props);
    cb();
  }.bind( this ));
};

Generator.prototype.writeFiles = function createManifest() {
  var data = {
  	secure: this.secure,
    userName: this.userName,
    projectName: this.projectName,
    fullName: this.fullName,
    email: this.email
  };
  this.directory( '.', '.' );
  this.template( '.travis.yml', '.travis.yml', data );
};
