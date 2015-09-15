//expose QUnit results to sauce labs using globals (sad but true)
var QUnit = require('qunitjs');
var testCases = [];

QUnit.done(function(results) {

    var failing = testCases
        .filter(function(testCase) {
            return testCase.result === false;
        })
        .map(function(testCase) {
            return {
                name:     testCase.module + ' : ' + testCase.name,
                result:   testCase.result,
                expected: testCase.expected,
                actual:   testCase.actual,
                source:   testCase.source
            };
        });

    window.global_test_results = {
        passed:   results.passed,
        failed:   results.failed,
        total:    results.total,
        duration: results.runtime,
        tests:    failing
    };
});

QUnit.testStart(function() {
    QUnit.log(function(details) {
        testCases.push(details);
    });
});

