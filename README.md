##*yeoman init travis-ci:[task]*

This is a [yeoman generator](https://github.com/yeoman/generators) that provides travis-ci setup for yeoman projects. Currently the only sub-task is *gh-pages*.

##*yeoman init travis-ci:gh-pages*

Aims to make yeoman sites work similar to jekyll sites on github pages. Commit the raw files and what is served is the built site.

Creates a *.travis.yml* file that tells travis-ci to build the yeoman project in your master branch after every commit and push the built site into your project's *gh-pages* branch. 

__Warning!__ Currently you still have to log into travis-ci.org and enable the hooks for your specific repo, which is kind of a drag. Also, it assumes that you have the travis gem installed.


# Travis-ci generator [![Build Status](https://secure.travis-ci.org/pwmckenna/yeoman-travis-ci.png?branch=master)](http://travis-ci.org/pwmckenna/yeoman-travis-ci)

> Aims to make yeoman sites work similar to jekyll sites on github pages. Commit the raw files and what is served is the built site.

> Creates a *.travis.yml* file that tells travis-ci to build the yeoman project in your master branch after every commit and push the built site into your project's *gh-pages* branch. 

> __Warning!__ Currently you still have to log into travis-ci.org and enable the hooks for your specific repo, which is kind of a drag. Also, it assumes that you have the travis gem installed.


Usage: `yeoman init travis-ci:gh-pages`

Available sub-generators:

- travis-ci:gh-pages
- suggestions?

## Contribute

See the [contributing docs](https://github.com/yeoman/yeoman/blob/master/contributing.md)


## License

[BSD license](http://opensource.org/licenses/bsd-license.php)
