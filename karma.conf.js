module.exports = function(config) {
    config.set({

        basePath: '',

        frameworks: ['browserify', 'mocha'],

        files: [
            'test/*.js'
        ],

        exclude: [],

        preprocessors: {
            'test/*.js': ['browserify']
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
            'karma-browserify'
        ],


    });
};

