# generator-travis-ci

> [![Build Status](https://travis-ci.org/pwmckenna/generator-travis-ci.png?branch=master)](https://travis-ci.org/pwmckenna/generator-travis-ci)

## Installation

__`npm install -g generator-travis-ci`__

## Usage

__`yo travis-ci`__

## Requirements

####Yeoman

Beta version 1.0 and hopefully all future versions.

####GitHub
Travis is deeply integrated with github, and in order to set all the travis hooks for you, this generator must be run on project hosted on github. Your git remotes should looks something like this:

__`git remote -v`__
> origin  git@github.com:pwmckenna/generator-travis-ci.git (fetch)
> origin  git@github.com:pwmckenna/generator-travis-ci.git (push)

## Sub-Generators:

#### default generator

> Sets up travis-ci.org to track your project and creates a basic .travis.yml that runs `grunt` on each commit.

> You can then display your projects build/test status in your README or elsewhere using a travis badge like above.

Usage: __`yo travis-ci:default`__

#### gh-pages generator

> An automated alternative to https://github.com/yeoman/yeoman/wiki/Deployment.
> Aims to make yeoman sites work similar to jekyll sites on github pages. Commit the raw files into master and what is served via gh-pages is `grunt build` output. For [user & organization pages](https://help.github.com/articles/user-organization-and-project-pages#user--organization-pages), you specify the branch you'd like to develop in, and the output is pushed to master.

> Creates a *.travis.yml* file that tells travis-ci to build the yeoman project in your master branch after every commit and push the built site into your project's *gh-pages* branch.

Usage: __`yo travis-ci:gh-pages`__

#### suggestions?

If you have suggestions for common yeoman/grunt testing/deployment tasks that could be handled best by a continuous integration service, make a pull request or shoot me a message!

## Contribute

See the [contributing docs](https://github.com/yeoman/yeoman/blob/master/contributing.md)


## License

[BSD license](http://opensource.org/licenses/bsd-license.php)
