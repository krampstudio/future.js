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
                transform: ['babelify', ['hbsfy', {
                    'extensions': ['tpl']
                }]],
                browserifyOptions: {
                    debug: true
                }
            },
            test: {
                files: {
                    'test/fwc/api/test.bundle.js': ['test/fwc/api/test.js'],
                    'test/fwc/integration/test.bundle.js': ['test/fwc/integration/test.js']
                },
            }
        },

       'extract_sourcemap': {
            test: {
                files: {
                    'test/fwc/api': ['test/fwc/api/test.bundle.js'],
                    'test/fwc/integration': ['test/fwc/integration/test.bundle.js']
                }
            }
        },

        watch : {
            test : {
                files : ['test/**/test.js'],
                tasks : ['browserify:test', 'extract_sourcemap:test']
            }
        }

    });

    grunt.registerTask('test', "compile tests", ['browserify:test', 'extract_souremap:test']);
    grunt.registerTask('devtest', "develop tests", ['connect', 'open:test', 'watch:test']);
};
