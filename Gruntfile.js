module.exports = function(grunt) {

    var browsers = [{
        browserName: "firefox",
        platform: 'Windows 8.1',
        version: "37"
    }, {
        browserName: "chrome",
        platform: 'Windows 8.1',
        version: "43"
    }, {
        browserName: "internet explorer",
        platform: 'Windows 8.1',
        version: "11"
    }];

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
            },
            live : {
                options: {
                    hostname: '<%=pkg.config.host%>',
                    port: '<%=pkg.config.port%>',
                    base: '.',
                    keepalive : true
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
        },

        'saucelabs-qunit': {
            test: {
                options: {
                    urls: [
                        'http://<%=pkg.config.host%>:<%=pkg.config.port%>/test/events/test.html',
                        'http://<%=pkg.config.host%>:<%=pkg.config.port%>/test/fwc/api/test.html',
                        'http://<%=pkg.config.host%>:<%=pkg.config.port%>/test/fwc/integration/test.html'
                    ],
                    tunnelTimeout: 5,
                    build: "<%=pkg.version%>-" + Date.now(),
                    concurrency: 3,
                    browsers: browsers,
                    'max-duration' : 30
                }
            }
        },
    });

    grunt.registerTask('build', 'Build project', ['browserify:core', 'exorcise:core', 'uglify:core']);
    grunt.registerTask('devtest', 'Develop tests', ['connect:preview', 'open:test', 'concurrent:devtest']);
    grunt.registerTask('test', 'Run tests', ['browserify:core', 'browserify:test', 'connect:preview', 'saucelabs-qunit:test']);
};

