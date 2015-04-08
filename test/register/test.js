var fwc = require('../../src/fwc.js');

QUnit.module('Register');

QUnit.asyncTest('Basic component registration', 1, function(assert){
    var container = document.getElementById('permanent-fixture');
    fwc('base')
        .on('error', function(e){
            console.error(e);
        })
        .on('create', function(){

            var fBase = container.querySelector('f-base');
            assert.equal(fBase.nodeName, 'F-BASE', 'The f-base component is found');

            console.log(fBase, this);

            QUnit.start();
        })
        .register();
});
