##*yeoman init travis-ci:[task]*

This is a [yeoman generator](https://github.com/yeoman/generators) that provides travis-ci setup for yeoman projects. Currently the only sub-task is *gh-pages*.

##*yeoman init travis-ci:gh-pages*

Aims to make yeoman sites work similar to jekyll sites on github pages. Commit the raw files and what is served is the built site.

Creates a *.travis.yml* file that tells travis-ci to build the yeoman project in your master branch after every commit and push the built site into your project's *gh-pages* branch. 

__Warning!__ Currently you still have to log into travis-ci.org and enable the hooks for your specific repo, which is kind of a drag. Also, it assumes that you have the travis gem installed.

## In action
![](http://s8.postimage.org/90spzjn9h/Screen_Shot_2013_01_19_at_12_55_32_AM.png)
