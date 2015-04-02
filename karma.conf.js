module.exports = function(config) {
    config.set({

        basePath: '',

        frameworks: ['browserify', 'mocha'],

        files: [

            'test/api/test.html',
            //'test/integration/*.js',
            //'test/fixtures/*.html'
        ],

        exclude: [],

        //preprocessors: {
            //'test/api/test.html': ['html2js'],
            //'test/api/*.js' : ['browserify'],
            //'test/integration/*.js' : ['browserify'],
            //'test/fixtures/*.html': ['html2js']
        //},

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
            'karma-html2js-preprocessor'
        ],
    });
};

