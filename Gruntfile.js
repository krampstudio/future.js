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
                    hostname: '<%=pkg.config.host%>',
                    port: '<%=pkg.config.port%>',
                    base: '.'
                }
            }
        },

        open: {
            test: {
                path: 'http://<%=pkg.config.host%>:<%=pkg.config.port%>/test/',
                app: '<%=pkg.config.browser%>'
            }
        },

        browserify: {
            options: {
                transform: [
                    'babelify', ['hbsfy', {
                        'extensions': ['tpl']
                    }]
                ],
                browserifyOptions: {
                    debug: true
                }
            },
            core: {
                files: {
                    'dist/fwc.js': ['src/index.js']
                },
                options : {
                    alias : {
                        'fwc' : './src/fwc.js',
                        'events' : './src/events.js'
                    }
                }
            },
            test: {
                files: {
                    'test/fwc/api/test.bundle.js': ['test/fwc/api/test.js'],
                    'test/fwc/integration/test.bundle.js': ['test/fwc/integration/test.js'],
                    'test/events/test.bundle.js': ['test/events/test.js']
                },
            }
        },

        exorcise: {
            options: {
                base: '.'
            },
            core: {
                files: {
                    'dist/fwc.js.map': ['dist/fwc.js']
                }
            },
            test: {
                files: {
                    'test/fwc/api/test.bundle.js.map': ['test/fwc/api/test.bundle.js'],
                    'test/fwc/integration/test.bundle.js.map': ['test/fwc/integration/test.bundle.js'],
                    'test/events/test.bundle.js.map': ['test/events/test.bundle.js']
                }
            }
        },

        uglify: {
            core: {
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true,
                    sourceMapIn: 'dist/fwc.js.map'
                },
                files: {
                    'dist/fwc.min.js': ['dist/fwc.js'],
                },
            },
        },

        watch: {
            core: {
                files: ['src/*.js'],
                tasks: ['compile']
            },
            test: {
                files: ['test/**/test.js'],
                tasks: ['test']
            }
        }
    });

    grunt.registerTask('compile', 'compile', ['browserify:core', 'exorcise:core', 'uglify:core']);
    grunt.registerTask('test', 'compile tests', ['browserify:test', 'exorcise:test']);
    grunt.registerTask('devtest', 'develop tests', ['connect', 'test', 'open:test', 'watch:test']);
};

