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
            },

            test: {
                path: 'http://localhost:4123/test/',
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
            },
            test: {
                files: {
                    'test/fwc/api/test.bundle.js': ['test/fwc/api/test.js'],
                    'test/fwc/integration/test.bundle.js': ['test/fwc/integration/test.js']
                }
            },
            devtest: {
                files: {
                    'test/fwc/api/test.bundle.js': ['test/fwc/api/test.js'],
                    'test/fwc/integration/test.bundle.js': ['test/fwc/integration/test.js']
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
            api : {
                options : {
                    autoWatch: false,
                    singleRun: true,

                },
                    files : ['test/api/*.html']
            },
            register : {
                autoWatch: false,
                singleRun: true,
                files : ['test/register.js']
            },
            attribute : {
                autoWatch: false,
                singleRun: true,
                files : ['test/attribute.js']
            }
        },

        qunit : {
            all : ['test/api/test.html']
        }
    });

    grunt.registerTask('preview', "Preview and development mode", ['connect:preview', 'open:preview', 'browserify:dev']);
    grunt.registerTask('devtest', "develop tests", ['connect', 'open:test', 'browserify:devtest']);
};
