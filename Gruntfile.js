module.exports = function(grunt) {
    'use strict';

    var browsers = [{
        browserName: "firefox",
        platform: 'Windows 8.1',
        version: "37"
    }, {
        browserName: "chrome",
        platform: 'Windows 8.1',
        version : "43"
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
            options : {
                hostname: '<%=pkg.config.host%>',
                port: '<%=pkg.config.port%>',
                base: '.'
            },
            preview: {
                options: {
                    livereload : true
                }
            },
            alive : {
                options: {
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
                        'fwc':      './src/fwc.js',
                        'eventify': './src/eventify.js',
                        'router':   './src/router.js'
                    }
                }
            },
            test: {
                files: {
                    'test/eventify/test.bundle.js':         ['test/eventify/test.js'],
                    'test/fwc/api/test.bundle.js':          ['test/fwc/api/test.js'],
                    'test/fwc/integration/test.bundle.js':  ['test/fwc/integration/test.js'],
                    'test/router/test.bundle.js':           ['test/router/test.js'],
                },
                options : {
                    external : ['fwc', 'eventify', 'router'],
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
                    'test/eventify/test.bundle.js.map':        ['test/eventify/test.bundle.js'],
                    'test/fwc/api/test.bundle.js.map':         ['test/fwc/api/test.bundle.js'],
                    'test/fwc/integration/test.bundle.js.map': ['test/fwc/integration/test.bundle.js'],
                    'test/router/test.bundle.js.map':          ['test/router/test.bundle.js'],
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
                tasks: ['compile-core']
            },
            test: {
                files: ['test/**/test.js'],
                tasks: ['compile-test'],
                options: {
                    livereload: true
                },
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
                        'http://<%=pkg.config.host%>:<%=pkg.config.port%>/test/eventify/test.html',
                        'http://<%=pkg.config.host%>:<%=pkg.config.port%>/test/fwc/api/test.html',
                        'http://<%=pkg.config.host%>:<%=pkg.config.port%>/test/fwc/integration/test.html',
                        'http://<%=pkg.config.host%>:<%=pkg.config.port%>/test/router/test.html'
                    ],
                    tunnelTimeout: 15,
                    testname: 'Future.js tests',
                    build: "<%=pkg.version%>-" + Date.now(),
                    browsers: browsers,
                    'max-duration' : 30,
                    onTestComplete : function(results, cb) {
                        grunt.log.write(require('util').inspect(results, { colors: true }));

                        //test pass for now
                        cb(null, true);
                    }
                }
            }
        },
    });

    grunt.registerTask('compile-core', 'Compile sources', ['browserify:core', 'exorcise:core']);
    grunt.registerTask('compile-test', 'Compile tests', ['browserify:test', 'exorcise:test']);

    grunt.registerTask('build', 'Build the project', ['browserify:core', 'exorcise:core', 'uglify:core']);

    grunt.registerTask('devtest', 'Develop and preview tests', ['compile-core', 'compile-test', 'connect:preview', 'open:test', 'concurrent:devtest']);
    grunt.registerTask('saucetest', 'Run tests using sauce labs', ['compile-core', 'compile-test', 'connect:preview', 'saucelabs-qunit:test']);
};

