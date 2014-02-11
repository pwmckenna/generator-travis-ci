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
                '**/*.js',
                '!node_modules/**/*.js'
            ]
        },
        mochaTest: {
            files: [
                'test/**/*.js'
            ]
        },
        env: {
            test: {
                src: '.env'
            }
        }
    });

    grunt.registerTask('travis', ['jshint']);
    grunt.registerTask('test', ['jshint', 'env:test', 'mochaTest']);
};
