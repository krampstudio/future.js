var fwc = require('../../../src/fwc.js');

QUnit.module('Register');

QUnit.asyncTest('register and access a component', 4, function(assert){
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

QUnit.module('Attributes');

QUnit.asyncTest('define basic attributes', 8, function(assert){
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

QUnit.asyncTest('define attributes with accessors', 11, function(assert){
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('access')
        .on('error', function(e){
            console.error(e);
        })
        .on('create', function(elt){

            var fAccess = container.querySelector('f-access');
            assert.deepEqual(fAccess, elt, 'The callback elt is the given node');
            assert.equal(fAccess.getAttribute('num'), '1', 'The num attribute has the value');
            assert.ok(fAccess.hasAttribute('bool'), 'The bool attribute exists');
            assert.equal(fAccess.getAttribute('inc'), '0', 'The inc attribute has the value');
            assert.equal(fAccess.getAttribute('double'), '0', 'The double attribute has the value');

            assert.equal(fAccess.num, 1, 'The num getter is called');
            assert.equal(fAccess.bool, false, 'The bool getter is called');
            assert.equal(fAccess.inc, 1, 'The inc getter is called');
            assert.equal(fAccess.inc, 2, 'The inc getter is called');

            fAccess.double = 2;
            assert.equal(fAccess.double, 4, 'The double setter is callede');

            QUnit.start();
        })
        .attrs('num', 'bool', 'inc')
        .access('num', {
            get(val){
               return parseInt(val, 10);
            }
        })
        .access('double', {
            get(val){
               return parseInt(val, 10);
            },
            set(old, val){
                val = parseInt(val, 10);
                val = val * 2;
                return val;
            }
        })
        .access('bool', {
            get(val){
               return !!val;
            }
        })
        .access('inc', {
            get(val){
                val = parseInt(val, 10);
                this.setAttribute('inc', ++val);
               return val;
            }
        })
        .register();
});

QUnit.module('Content');

QUnit.asyncTest('Component with content from a callback', 11, function(assert){
    var container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    var componentContent = function componentContent(data){

        assert.ok(typeof data === 'object', 'The argument is an object that contains component attributes');
        assert.ok(typeof data.foo === 'string', 'The argument is an object that contains the foo attribute');
        assert.ok(typeof data.repeat === 'string', 'The argument is an object that contains the repeat attribute');

        var content = '';
        var times   = parseInt(data.repeat || 0);
        while(times--){
            content += `<li>${data.foo}</li>`;
        }
        return `<ul>${content}</ul>`;
    };

    assert.equal(container.querySelectorAll('f-content ul').length, 0, 'The component does not contain a list');

    fwc('content')
        .on('error', function(e){
            console.error(e);
        })
        .on('create', function(elt){

            var fContent = container.querySelector('f-content');
            assert.deepEqual(fContent, elt, 'The callback elt is the given node');
            assert.equal(fContent.repeat, '2', 'The repeat value is 2');
            assert.equal(fContent.foo, 'moo', 'The foo value is moo');
            assert.equal(elt.querySelectorAll('ul').length, 1, 'The component contains now a list');
            assert.equal(elt.querySelectorAll('li').length, 2, 'The component contains now 2 list items');
            assert.equal(elt.querySelector('li:first-child').textContent, 'moo', 'The list items have the foo value');

            QUnit.start();
        })
        .attrs('foo', 'repeat')
        .content(componentContent)
        .register();
});