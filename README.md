#generator-travis-ci

This is a [yeoman generator](https://github.com/yeoman/generator) that provides travis-ci setup for yeoman projects.

## install

> npm install generator-travis-ci

Available sub-generators:

- default
- gh-pages
- suggestions?

## default

> Simply sets up travis-ci.org to track your project and creates a basic .travis.yml that runs `npm test` on each commit.

Usage: `yo travis-ci`

## gh-pages

> Aims to make yeoman sites work similar to jekyll sites on github pages. Commit the raw files into master and what is served via gh-pages is `grunt build` output.

> Creates a *.travis.yml* file that tells travis-ci to build the yeoman project in your master branch after every commit and push the built site into your project's *gh-pages* branch.

Usage: `yo travis-ci:gh-pages`

### In action

![](http://s8.postimage.org/90spzjn9h/Screen_Shot_2013_01_19_at_12_55_32_AM.png)

## Contribute

See the [contributing docs](https://github.com/yeoman/yeoman/blob/master/contributing.md)


## License

[BSD license](http://opensource.org/licenses/bsd-license.php)
