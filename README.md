#yeoman init travis-ci:[sub-generator]

This is a [yeoman generator](https://github.com/yeoman/generators) that provides travis-ci setup for yeoman projects. Currently the only sub-generator is *gh-pages*.

## gh-pages sub-generator

> Aims to make yeoman sites work similar to jekyll sites on github pages. Commit the raw files and what is served is the built site.

> Creates a *.travis.yml* file that tells travis-ci to build the yeoman project in your master branch after every commit and push the built site into your project's *gh-pages* branch. 

> __Warning!__ Currently you still have to log into travis-ci.org and enable the hooks for your specific repo, which is kind of a drag. Also, it assumes that you have the travis gem installed.


Usage: `yeoman init travis-ci:gh-pages`

Available sub-generators:

- travis-ci:gh-pages
- suggestions?

### In action

![](http://s8.postimage.org/90spzjn9h/Screen_Shot_2013_01_19_at_12_55_32_AM.png)


Generated .travis.yml file can be seen [here](https://github.com/pwmckenna/mduel/blob/master/.travis.yml).

## Contribute

See the [contributing docs](https://github.com/yeoman/yeoman/blob/master/contributing.md)


## License

[BSD license](http://opensource.org/licenses/bsd-license.php)
