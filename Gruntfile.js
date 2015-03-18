module.exports = function(grunt) {

    //display times
    require('time-grunt')(grunt);

    //load npm tasks
    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        connect: {
            preview: {
                options: {
                    port: 4123,
                    base: '.'
                }
            }
        },

        open: {
            preview: {
                path: 'http://localhost:4123/public/index.html',
                app: 'fxdev -no-remote'
            }
        },

        browserify: {
            options: {
                transform: ['babelify', ['hbsfy', { 'extensions' : ['tpl']}]],
            },
            build: {
                files: {
                    'public/js/main.js': ['public/js/src/**/*.js']
                }
            },
            dev : {
                files: {
                    'public/js/main.js': ['public/js/src/main.js']
                },
                options: {
                    watch : true,
                    keepAlive : true,
                    browserifyOptions: {
                        debug: true
                    }
                }
            }
        },

        karma : {
            options : {
                configFile:"karma.conf.js",
            },
            test : {
                autoWatch: false,
                singleRun: true
            },
            dev : {
                autoWatch: true,
                singleRun: false
            }
        }
    });

    grunt.registerTask('preview', "Preview and development mode", ['connect:preview', 'open:preview', 'browserify:dev']);
};
