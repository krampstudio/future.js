module.exports = function(grunt) {

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
            }
        },

        open: {
            preview: {
                path: 'http://<%=pkg.config.host%>:<%=pkg.config.port%>/index.html',
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
            main: {
                files: {
                    'js/main.min.js': ['js/main.js']
                }
            }
        },

        exorcise: {
            options: {
                base: '.'
            },
            main: {
                files: {
                    'js/main.min.js.map': ['js/main.min.js']
                }
            },
        },

        watch: {
            main: {
                files: ['js/main.js', 'js/components/**/*.js'],
                tasks: ['compile'],
                options : {
                    livereload : true
                }
            },

        },

    });

    grunt.registerTask('compile', 'Compile sources', ['browserify:main', 'exorcise:main']);
    grunt.registerTask('preview', 'Preview site', ['compile', 'connect:preview', 'open:preview', 'watch:main']);


};

