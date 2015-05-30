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
                    hostname: "<%pkg.config.host%>",
                    port: "<%=pkg.config.port%>",
                    base: '.'
                }
            }
        },

        open: {
            test: {
                path: 'http://<%=pkg.config.host%>:<%=pkg.config.port%>/test/',
                app: "<%=pkg.config.browser%>"
            }
        },

        browserify: {
            options: {
                transform: [
                    'babelify',
                    [ 'hbsfy', { 'extensions': ['tpl'] } ]
                ],
                browserifyOptions: {
                    debug: true
                },
            },
            core: {
                files : {
                    'dist/future.js' : ['src/fwc.js']
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

       'extract_sourcemap': {
            core: {
               files : {
                  'dist' : ['dist/*.js']
               }
            },
            test: {
                files: {
                    'test/fwc/api': ['test/fwc/api/test.bundle.js'],
                    'test/fwc/integration': ['test/fwc/integration/test.bundle.js']
                }
            }
        },

        watch : {
            core : {
                files : ['src/*.js'],
                tasks : ['compile']
            },
            test : {
                files : ['test/**/test.js'],
                tasks : ['test']
            }
        },

        concurrent : {
            options: {
                logConcurrentOutput: true
            },
            devtest : ['watch:core', 'watch:test']
        }

    });

    grunt.registerTask('compile', 'compile', ['browserify:core', 'extract_sourcemap:core']);

    grunt.registerTask('test', "compile tests", ['browserify:test', 'extract_sourcemap:test']);

    grunt.registerTask('devtest', "develop tests", ['connect', 'open:test', 'watch:test']);
};
