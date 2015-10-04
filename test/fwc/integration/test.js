import 'webcomponents.js/webcomponents.js' ;
import '../../sauce.js';
import QUnit from 'qunitjs';
import fwc from 'fwc';


QUnit.module('Register');

QUnit.test('register and access a component', assert => {
    assert.expect(4);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('base')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            let fBase = container.querySelector('f-base');
            assert.equal(fBase.nodeName, 'F-BASE', 'The f-base component is found');
            assert.equal(fBase.nodeName, elt.nodeName, 'The f-base component is given in parameter');
            assert.deepEqual(fBase, elt, 'The callback elt is the given node');

            done();
        })
        .register();
});

QUnit.test('register with another namespace  in options', assert => {
    assert.expect(4);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('bar', {namespace : 'foo'})
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            let fooBar = container.querySelector('foo-bar');
            assert.equal(fooBar.nodeName, 'FOO-BAR', 'The foo-bar component is found');
            assert.equal(fooBar.nodeName, elt.nodeName, 'The foo-bar component is given in parameter');
            assert.deepEqual(fooBar, elt, 'The callback elt is the given node');

            done();
        })
        .register();
});

QUnit.test('register with another namespace', assert => {
    assert.expect(4);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('baz-bar')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            let bazBar = container.querySelector('baz-bar');
            assert.equal(bazBar.nodeName, 'BAZ-BAR', 'The baz-bar component is found');
            assert.equal(bazBar.nodeName, elt.nodeName, 'The baz-bar component is given in parameter');
            assert.deepEqual(bazBar, elt, 'The callback elt is the given node');

            done();
        })
        .register();
});

QUnit.test('register and multiple component', assert => {
    assert.expect(7);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    let sum = 0;

    fwc('multi')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            assert.equal(elt.nodeName, 'F-MULTI', 'The element is a multi');
            let value = parseInt(elt.getAttribute('value'), 10);
            assert.ok(value > 0, 'The  value has an int');
            sum += value;

            if(sum === 7){

                done();
            }
        })
        .register();
});

QUnit.module('Attributes');

QUnit.test('define basic attributes', assert => {
    assert.expect(8);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('attr-basic')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            let attrBasic = container.querySelector('attr-basic');
            assert.deepEqual(attrBasic, elt, 'The callback elt is the given node');
            assert.equal(attrBasic.foo, '');
            assert.equal(attrBasic.bar, 'pur');
            assert.equal(attrBasic.foo, attrBasic.getAttribute('foo'));
            assert.equal(attrBasic.bar, attrBasic.getAttribute('bar'));

            attrBasic.foo = 'moo';
            assert.equal(attrBasic.foo, 'moo');
            assert.equal(attrBasic.foo, attrBasic.getAttribute('foo'));

            done();
        })
        .attrs('foo', 'bar')
        .register();
});


QUnit.test('define forbidden attributes', assert => {
    assert.expect(3);

    assert.throws( e => {
        fwc('attr-wrong')
            .attrs('id')
            .register();
    }, TypeError, 'The attribute id cannot be used');

    assert.throws( e => {
        fwc('attr-wrong')
            .attrs('class')
            .register();
    }, TypeError, 'The attribute class cannot be used');

    assert.throws( e => {
        fwc('attr-wrong')
            .attrs('is')
            .register();
    }, TypeError, 'The attribute is cannot be used');
});

QUnit.test('define attributes with type casting', assert => {
    assert.expect(16);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('attr-cast')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            let attrCast = container.querySelector('attr-cast');
            assert.deepEqual(attrCast, elt, 'The callback elt is the given node');

            assert.equal(attrCast.getAttribute('int'), '134.12', "The attribute exists");
            assert.equal(attrCast.int, 134, "The getter gives you the parsed value");
            attrCast.int = "5.77";
            assert.equal(attrCast.getAttribute('int'), '5', "The value is updated once parsed");
            assert.equal(attrCast.int, 5, "The getter gives you the parsed value");

            assert.equal(attrCast.getAttribute('float'), 1.23, "The attribute exists");
            assert.equal(attrCast.float, 1.23, "The getter gives you the parsed value");
            attrCast.float = "00.77";
            assert.equal(attrCast.getAttribute('float'), '0.77', "The value is updated once parsed");
            assert.equal(attrCast.float, 0.77, "The getter gives you the parsed value");

            assert.ok(attrCast.hasAttribute('bool'), "The attribute exists");
            assert.equal(attrCast.bool, true, "The attribute has the parsed value");
            attrCast.bool = false;
            assert.ok(!attrCast.hasAttribute('bool'), "The attribute doesn't exists anymore");
            assert.equal(attrCast.bool, false, "The attribute has the false value");
            attrCast.bool = true;
            assert.ok(attrCast.hasAttribute('bool'), "The attribute is again there");
            assert.equal(attrCast.bool, true, "The attribute has the true value");

            done();
        })
        .attr('int',     { type : 'int' })
        .attr('float',   { type : 'float' })
        .attr('bool',    { type : 'boolean' })
        .attr('array',   { type : 'array' })
        .attr('array2',  { type : '[]' })
        .attr('strings', { type : 'string[]' })
        .attr('ints',    { type : 'int[]' })
        .attr('floats',  { type : 'float[]' })
        .attr('bools',   { type : 'string[]' })
        .register();
});

QUnit.test('define attributes with accessors', assert => {
    assert.expect(11);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('access')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            let fAccess = container.querySelector('f-access');
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

            done();
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


QUnit.module('Methods');

QUnit.test('Component with a method', assert => {
    assert.expect(7);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    let mTarget = container.querySelector('.mtarget');
    assert.ok(mTarget.style.display !== 'none', "The mtarget content is displayed");

    fwc('method')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            let fMethod = container.querySelector('f-method');
            assert.deepEqual(fMethod, elt, 'The callback elt is the given node');

            assert.ok(typeof fMethod.hide === 'function', 'The element has the defined method');

            fMethod.hide();

            assert.equal(mTarget.style.display, 'none', "The mtarget content isn't displayed anymore");

            QUnit.start();
        })
        .method('hide', function(){

            var fMethod = container.querySelector('f-method');
            assert.deepEqual(fMethod, this, 'This is the given node');

            assert.equal(this.target, '.mtarget', 'The attribute value is correct');

            document.querySelector(this.target).style.display = 'none';
        })
        .attrs('target')
        .register();
});

QUnit.module('Content');

QUnit.test('Component with content from a callback', assert => {
    assert.expect(11);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    let componentContent = function componentContent(data){

        assert.ok(typeof data === 'object', 'The argument is an object that contains component attributes');
        assert.ok(typeof data.foo === 'string', 'The argument is an object that contains the foo attribute');
        assert.ok(typeof data.repeat === 'string', 'The argument is an object that contains the repeat attribute');

        let content = '';
        let times   = parseInt(data.repeat || 0);
        while(times--){
            content += `<li>${data.foo}</li>`;
        }
        return `<ul>${content}</ul>`;
    };

    assert.equal(container.querySelectorAll('f-content ul').length, 0, 'The component does not contain a list');

    fwc('content')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            let fContent = container.querySelector('f-content');
            assert.deepEqual(fContent, elt, 'The callback elt is the given node');
            assert.equal(fContent.repeat, '2', 'The repeat value is 2');
            assert.equal(fContent.foo, 'moo', 'The foo value is moo');
            assert.equal(elt.querySelectorAll('ul').length, 1, 'The component contains now a list');
            assert.equal(elt.querySelectorAll('li').length, 2, 'The component contains now 2 list items');
            assert.equal(elt.querySelector('li:first-child').textContent, 'moo', 'The list items have the foo value');

            done();
        })
        .attrs('foo', 'repeat')
        .content(componentContent)
        .register();
});

QUnit.test('Component with dynamic content from a template', assert => {
    assert.expect(8);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    let helloTpl = require('./hello.tpl');
    assert.ok(typeof helloTpl === 'function', 'The template function exists');

    assert.equal(container.querySelectorAll('f-dyncontent h1').length, 0, 'The component does not contain an h1');

    fwc('dyncontent')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            let fDynContent = container.querySelector('f-dyncontent');
            assert.deepEqual(fDynContent, elt, 'The callback elt is the given node');

            assert.equal(fDynContent.who, 'world', 'The attribute who has the world value');
            assert.equal(container.querySelectorAll('f-dyncontent h1').length, 1, 'The component contains an h1');

            assert.equal(fDynContent.textContent.trim(), 'Hello world', 'The element has the content from the who attribute');

            fDynContent.who = "Bertrand";
            setTimeout( () => {
                assert.equal(fDynContent.textContent.trim(), 'Hello Bertrand', 'The element has the updated content');
                done();
            }, 0);
        })
        .attr('who', { update: true })
        .content(helloTpl)
        .register();
});

QUnit.test('Component with dynamic content from an HTML template', assert => {
    assert.expect(4);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    let htpl = document.getElementById('htpl');

    fwc('hcontent')
        .on('create', function(elt){

            let fHontent = container.querySelector('f-hcontent');
            assert.deepEqual(fHontent, elt, 'The callback elt is the given node');

            assert.equal(elt.querySelectorAll('p').length, 1, 'The component contains now a paragraph');
            assert.equal(elt.innerHTML, htpl.innerHTML, 'The component content is the same as the template');

            done();
        })
        .content(htpl)
        .register();
});


QUnit.module('extend');

QUnit.test('Extend an anchor', assert => {
    assert.expect(5);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    let link = document.querySelector('a.link');

    fwc('link')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            var flink = document.querySelector('.flink');

            assert.ok(flink instanceof HTMLElement, 'The component is an HTMLElement');
            assert.ok(flink instanceof HTMLAnchorElement, 'The component is an HTMLAnchorElement');

            assert.ok(link.href !== '#', "Anchor's href use getter/setter to change the value");
            assert.equal(flink.href, link.href, "The extended component uses base component getter/setter");

            done();
        })
        .extend('a')
        .register();
});

QUnit.test('Extend another component', assert => {
    assert.expect(3);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('upper')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){
            assert.ok(false, 'the parent element should not be created');
        })
        .access('bar', {
            get(val){
                val = val || '';
               return val.toUpperCase();
            }
        })
        .register();

    fwc('superup')
        .on('create', function(elt){

            let fsuperup = document.querySelector('.superup');

            assert.deepEqual(fsuperup, elt, 'The callback elt is the given node');
            assert.equal(elt.bar, 'BAR', 'Super element prototype has been extended');

            done();
        })
        .extend('upper')
        .register();
});


QUnit.module('Native events');

QUnit.test('on click', assert => {
    assert.expect(3);

    let done = assert.async();

    let container = document.getElementById('permanent-fixture');
    assert.ok(container instanceof HTMLElement, 'The container exists');

    fwc('native')
        .on('error', function(e){
            assert.ok(false, e);
        })
        .on('create', function(elt){

            let fNative = document.querySelector('f-native');
            assert.deepEqual(fNative, elt, 'The callback elt is the given node');

            fNative.click();
        })
        .on('click', function(elt){

            let fNative = document.querySelector('f-native');
            assert.deepEqual(fNative, elt, 'The callback elt is the given node');

            done();
        })
        .register();
});
