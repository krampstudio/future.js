module.exports = function(config) {
    config.set({

        basePath: '',

        frameworks: ['browserify', 'mocha', 'fixture'],

        files: [
            'node_modules/webcomponents.js/webcomponents.min.js',
            'test/*.js',
            'test/*.html'
        ],

        exclude: [],

        preprocessors: {
            'test/*.js':   ['browserify'],
            'test/*.html': ['html2js'],
            'test/*.json': ['html2js']
        },

        reporters: ['progress'],

        port: 9876,

        colors: true,

        logLevel: config.LOG_INFO,


        browsers: ['Firefox'],

        browserify: {
            debug: true,
            transform: ['babelify', ['hbsfy', { 'extensions' : ['tpl']}]],
        },

        plugins: [
            'karma-phantomjs-launcher',
            'karma-firefox-launcher',
            'karma-mocha',
            'karma-browserify',
            'karma-fixture',
            'karma-html2js-preprocessor'
        ],


    });
};

