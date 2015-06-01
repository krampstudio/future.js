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
                    'dist/future.js': ['src/index.js']
                },
                options : {
                    alias : {
                        'fwc' : './src/fwc.js',
                        'eventify' : './src/events.js'
                    }
                }
            },
            test: {
                files: {
                    'test/fwc/api/test.bundle.js': ['test/fwc/api/test.js'],
                    'test/fwc/integration/test.bundle.js': ['test/fwc/integration/test.js'],
                    'test/events/test.bundle.js': ['test/events/test.js']
                },
                options : {
                    external : ['fwc', 'eventify'],
                }
            }
        },

        exorcise: {
            options: {
                base: '.'
            },
            core: {
                files: {
                    'dist/future.js.map': ['dist/future.js']
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
                    sourceMapIn: 'dist/future.js.map'
                },
                files: {
                    'dist/future.min.js': ['dist/future.js'],
                },
            },
        },

        watch: {
            core: {
                files: ['src/*.js'],
                tasks: ['browserify:core', 'exorcise:core']
            },
            test: {
                files: ['test/**/test.js'],
                tasks: ['browserify:test', 'exorcise:test']
            }
        },


        concurrent: {
            devtest: {
                tasks: ['watch:core', 'watch:test'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    grunt.registerTask('build', 'Build project', ['browserify:core', 'exorcise:core', 'uglify:core']);
    grunt.registerTask('devtest', 'Develop tests', ['connect', 'open:test', 'concurrent:devtest']);
};

