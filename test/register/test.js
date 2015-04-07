var fwc = require('../../src/fwc.js');

QUnit.module('Register');

QUnit.asyncTest('Basic component registration', 1, function(assert){
    var container = document.getElementById('permanent-fixture');
    fwc('test')
        .on('error', function(e){
            console.error(e);
        })
        .on('create', function(){

            var ft = container.querySelector('f-test');
            assert.equal(ft.nodeName, 'F-TEST', 'The f-test component is found');

            QUnit.start();
        })
        .register();
});
