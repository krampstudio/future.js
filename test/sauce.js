//expose QUnit results to sauce labs using globals (sad but true)
var log = [];
var testName;

QUnit.done(function (results) {
  var tests = [];
  for(var i = 0, len = log.length; i < len; i++) {
    var details = log[i];
    tests.push({
      name:     details.name,
      result:   details.result,
      expected: details.expected,
      actual:   details.actual,
      source:   details.source
    });
  }
  results.tests = tests;

  window.global_test_results = results;
});

QUnit.testStart(function(testDetails){
  QUnit.log(function(details){
    if (!details.result) {
      details.name = testDetails.name;
      log.push(details);
    }
  });
});
