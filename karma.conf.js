module.exports = function(config) {
    config.set({

        basePath: '',

        frameworks: ['browserify', 'mocha', 'fixture'],

        files: [
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


        browsers: ['PhantomJS'],

        browserify: {
            debug: true,
            transform: ['babelify']
        },

        plugins: [
            'karma-phantomjs-launcher',
            'karma-mocha',
            'karma-browserify',
            'karma-fixture',
            'karma-html2js-preprocessor'
        ],


    });
};

