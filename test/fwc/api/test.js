import 'webcomponents.js/webcomponents-lite.js' ;
import '../../sauce.js';
import QUnit from 'qunitjs';
import fwc   from 'fwc';


QUnit.module('Module');

QUnit.test('factory', assert => {
    assert.expect(3);

    assert.ok(typeof fwc === 'function', "The module expose a function");
    assert.ok(typeof fwc('foo') === 'object', "The module creates an object");
    assert.notEqual(fwc('foo'), fwc('foo'), "The factory creates a new object at each call");
});


QUnit.module('Options');

QUnit.test('namespace', assert => {
    assert.expect(3);

    assert.throws(function(){
        fwc('foo', { namespace : '12' });
    }, TypeError, 'The namespace is not valid');

    assert.throws(function(){
        fwc('foo', { namespace : 't-' });
    }, TypeError, 'The namespace is not valid');

    assert.throws(function(){
        fwc('foo', { namespace : 't.' });
    }, TypeError, 'The namespace is not valid');

    fwc('foo', { namespace : 'bar' });
});


QUnit.module('Events');

QUnit.test("emitter", assert => {
    assert.expect(8);

    let comp = fwc('foo');
    let done = assert.async();

    assert.ok(typeof comp === 'object', "the component definition is an object");
    assert.ok(typeof comp.on === 'function', "the component defintion holds the method on");
    assert.ok(typeof comp.trigger === 'function', "the component defintion holds the method trigger");
    assert.ok(typeof comp.off === 'function', "the component defintion holds the method off");
    assert.ok(typeof comp.events === 'function', "the component defintion holds the method events");

    comp.on('error', e => {
        assert.ok(e instanceof Error, 'An error is emitted');
        assert.equal(e.message, 'test error', 'The message is given in the error');

        done();
    });
    assert.equal(comp.events('error').length, 1, "The component has on listener registered");
    comp.trigger('error', new Error('test error'));
});


QUnit.module('Attributes');

QUnit.test('definition', assert => {
    assert.expect(5);

    let comp = fwc('foo');

    assert.ok(typeof comp.attr === 'function', "the component definition holds the method attr");
    assert.equal(comp.attr('bar', {}), comp, "The method chains with arguments");
    assert.ok(typeof comp.attr('bar') === 'object', "the method returns the attribute definition");
    assert.ok(typeof comp.attr('bar').set === 'function', "the attribute definition has a setter");
    assert.ok(typeof comp.attr('bar').get === 'function', "the attribute definition has a getter");
});

QUnit.test('definition polymorphism', assert => {
    assert.expect(3);

    let comp = fwc('foo');

    comp.attr({name : 'bar'});
    assert.ok(typeof comp.attr('bar') === 'object', "the method returns the attribute definition");
    assert.ok(typeof comp.attr('bar').set === 'function', "the attribute definition has a setter");
    assert.ok(typeof comp.attr('bar').get === 'function', "the attribute definition has a getter");
});

QUnit.test('definition type casting', assert => {
    assert.expect(6);

    let comp = fwc('foo');

    let mock = {
        getAttribute(name){
            return this[name];
        },
        setAttribute(name, val){
            this[name] = val;
            return val;
        },
        hasAttribute(name){
            return this.hasOwnProperty(name);
        }
    };

    comp.attr('int', {type : 'integer'});
    comp.attr('float', {type : 'float'});
    comp.attr('bool', {type : 'boolean'});

    assert.equal(comp.attr('int').set.call(mock, "12.5"), 12,"the attribute setter set the parsed value");
    assert.equal(comp.attr('int').get.call(mock), 12, "the int getter returns the parsed value");

    assert.equal(comp.attr('float').set.call(mock, "12.5"), 12.5,"the attribute setter set the parsed value");
    assert.equal(comp.attr('float').get.call(mock), 12.5, "the int getter returns the parsed value");

    assert.equal(comp.attr('bool').set.call(mock, "a"), true,"the attribute setter set the parsed value");
    assert.equal(comp.attr('bool').get.call(mock), true, "the int getter returns the parsed value");
});

QUnit.test('multiple declarations', assert => {
    assert.expect(3);

    let comp = fwc('foo');

    assert.ok(typeof comp.attrs === 'function', "the component definition holds the method attrs");
    assert.equal(comp.attrs('bar', 'selected'), comp, "The method chains with arguments");
    assert.deepEqual(comp.attrs(), ['bar', 'selected'], "the method returns values without arguments");
});

QUnit.test('accessors', assert => {
    assert.expect(13);

    let comp = fwc('foo');

    let mock = {
        getAttribute(name){
            return this[name];
        },
        setAttribute(name, val){
            this[name] = val;
            return val;
        }
    };

    let testAccessors = {
        get(){
            return "foo";
        },
        set(old, val){
            return val + "bar";
        }
    };

    assert.ok(typeof comp.access === 'function', "the component definition holds the method access");
    assert.equal(comp.access('test', testAccessors), comp, "The method set and chains with arguments");

    assert.ok(typeof comp.access('test') === 'object', "The method returns the accessors without arguments");
    assert.ok(typeof comp.access('test').get === 'function', "The method returns the accessors without arguments");
    assert.ok(typeof comp.access('test').set === 'function', "The method returns the accessors without arguments");

    assert.equal(comp.access('test').get.call(mock), 'foo', "The getter returns the defined value");
    assert.equal(comp.access('test').set.call(mock, 'foo'), 'foobar', "The setter returns the defined value");

    comp.attrs('bar');
    assert.ok(typeof comp.access('bar') === 'object', "Attributes have default accessors");
    assert.ok(typeof comp.access('foo') === 'undefined', "Only attributes have default accessors");
    assert.ok(typeof comp.access('bar').get === 'function', "The method returns the accessors without arguments");
    assert.ok(typeof comp.access('bar').set === 'function', "The method returns the accessors without arguments");

    assert.equal(comp.access('bar').set.call(mock, 'bee'), 'bee', "The setter returns the defined value");
    assert.equal(comp.access('bar').get.call(mock), 'bee', "The getter returns the defined value");
});


QUnit.module('Methods');

QUnit.test('declaration', assert => {
    assert.expect(5);

    let comp = fwc('foo');

    let foo = (...params) => params;

    assert.ok(typeof comp.method === 'function', "the component definition holds the method method");

    assert.equal(comp.method('foo', foo), comp, "The method set and chains with arguments");
    assert.ok(typeof comp.method('foo') === 'object', "The method returns an object with the name arguments");
    assert.ok(typeof comp.method('foo').value === 'function', "The method returns the function without arguments");
    assert.deepEqual(comp.method('foo').value.call(null, 'bar', 'baz'), ['bar', 'baz'], "The content function returns the arguments");
});


QUnit.module('Content');

QUnit.test('callback', assert => {
    assert.expect(6);

    let comp = fwc('foo');

    assert.ok(typeof comp.content === 'function', "the component definition holds the method content");

    assert.equal(comp.content('test'), comp, "The method set and chains with arguments");
    assert.ok(typeof comp.content() === 'function', "The method returns the function without arguments");
    assert.equal(comp.content().call(), 'test', "The content function returns the string set");

    comp.content(data => `<p>${data.foo}</p>`);

    let content = comp.content();
    assert.ok(typeof content === 'function', "The method return the set function without arguments");
    assert.equal(content({ foo: 'bar'}), '<p>bar</p>', "The function replace the content data");
});

QUnit.test('handlebar template', assert => {
    assert.expect(2);

    let comp = fwc('foo');

    //template is handled externally, by browserify
    comp.content(require('./test.tpl'));

    let content = comp.content();

    assert.ok(typeof content === 'function', "The method return the set function without arguments");
    assert.equal(content({ foo: 'bar'}).trim(), '<span>bar</span>', "The function replace the content data");
});


QUnit.module('Extend');

QUnit.test('element name', assert => {
    assert.expect(4);

    assert.throws(function(){
        fwc('foo').extend(12);
    }, TypeError, 'The element name is not valid');

    assert.throws(function(){
        fwc('foo').extend('t-');
    }, TypeError, 'The element name is not valid');

    assert.throws(function(){
        fwc('foo').extend('t.');
    }, TypeError, 'The element name is not valid');

    assert.throws(function(){
        fwc('foo').extend('_12');
    }, TypeError, 'The element name is not valid');

    fwc('foo').extend('bar');
});

QUnit.test('api', assert => {
    assert.expect(5);

    let comp = fwc('foo');

    assert.ok(typeof comp.extend === 'function', "the component definition holds the method extend");
    assert.equal(comp.extend('a'), comp, "The method set and chains with arguments");

    let baseProto = comp.extend();
    assert.ok(typeof baseProto === 'object', "The method returns an object without arguments");
    assert.ok(Object.prototype.isPrototypeOf(baseProto), "The method returns an prototype");
    assert.ok(HTMLElement.prototype.isPrototypeOf(baseProto), "The method returns an HTMLElement prototype");
});

QUnit.test('extend an html element', assert => {
    assert.expect(2);

    let comp = fwc('foo');

    comp.extend('a');

    let baseProto = comp.extend();
    assert.ok(HTMLElement.prototype.isPrototypeOf(baseProto), "Extending the a tag set the base prototype to HTMLElement");
    assert.ok(Object.is(baseProto, HTMLAnchorElement.prototype), "Extending the a tag set the base prototype to HTMLAnchorElement");
});
