'use strict';
module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'app/**/*.js',
                'gh-pages/**/*.js',
                'lib/**/*.js',
                'test/**/*.js'
            ]
        },
        mochaTest: {
            files: [
                'test/app/test.js',
                'test/gh-pages/test.js'
            ]
        },
        mochaTestConfig: {
            options: {
                reporter: 'spec'
            }
        }
    });

    // Default task.
    grunt.registerTask('default', ['jshint', 'mochaTest']);
};
