var fwc = require('../../src/fwc.js');

QUnit.module('Register');

QUnit.asyncTest('Basic component registration', 4, function(assert){
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('base')
        .on('error', function(e){
            console.error(e);
        })
        .on('create', function(elt){
            var fBase = container.querySelector('f-base');
            assert.equal(fBase.nodeName, 'F-BASE', 'The f-base component is found');
            assert.equal(fBase.nodeName, elt.nodeName, 'The f-base component is given in parameter');
            assert.deepEqual(fBase, elt, 'The callback elt is the given node');

            QUnit.start();
        })
        .register();
});

QUnit.asyncTest('Component with attributes', 8, function(assert){
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('attr')
        .on('error', function(e){
            console.error(e);
        })
        .on('create', function(elt){

            var fAttr = container.querySelector('f-attr');
            assert.deepEqual(fAttr, elt, 'The callback elt is the given node');
            assert.equal(fAttr.foo, '');
            assert.equal(fAttr.bar, 'pur');
            assert.equal(fAttr.foo, fAttr.getAttribute('foo'));
            assert.equal(fAttr.bar, fAttr.getAttribute('bar'));

            fAttr.foo = 'moo';
            assert.equal(fAttr.foo, 'moo');
            assert.equal(fAttr.foo, fAttr.getAttribute('foo'));

            QUnit.start();
        })
        .attrs('foo', 'bar')
        .register();
});
