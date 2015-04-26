var fwc = require('../../../src/fwc.js');

QUnit.module('Module');

QUnit.test('factory', 3, function(assert) {
    assert.ok(typeof fwc === 'function', "The module expose a function");
    assert.ok(typeof fwc() === 'object', "The module creates an object");
    assert.notEqual(fwc(), fwc(), "The factory creates a new object at each call");
});

QUnit.module('Events');

QUnit.asyncTest("emitter", 8, function(assert){

    var comp = fwc();

    assert.ok(typeof comp === 'object', "the component definition is an object");
    assert.ok(typeof comp.on === 'function', "the component defintion holds the method on");
    assert.ok(typeof comp.once === 'function', "the component defintion holds the method once");
    assert.ok(typeof comp.trigger === 'function', "the component defintion holds the method trigger");
    assert.ok(typeof comp.emit === 'function', "the component defintion holds the method emit");
    assert.ok(typeof comp.off === 'function', "the component defintion holds the method off");

    comp.on('error', function(e) {
        assert.ok(e instanceof Error, 'An error is emitted');
        assert.equal(e.message, 'test error', 'The message is given in the error');

        QUnit.start();
    });
    comp.emit('error', new Error('test error'));
});


QUnit.module('Attributes');


QUnit.test('definition', 5, function(assert){

    var comp = fwc();

    assert.ok(typeof comp.attr === 'function', "the component definition holds the method attr");
    assert.equal(comp.attr('id', {}), comp, "The method chains with arguments");
    assert.ok(typeof comp.attr('id') === 'object', "the method returns the attribute definition");
    assert.ok(typeof comp.attr('id').set === 'function', "the attribute definition has a setter");
    assert.ok(typeof comp.attr('id').get === 'function', "the attribute definition has a getter");
});


QUnit.test('definition polymorphism', 3, function(assert){

    var comp = fwc();

    comp.attr({name : 'id'});
    assert.ok(typeof comp.attr('id') === 'object', "the method returns the attribute definition");
    assert.ok(typeof comp.attr('id').set === 'function', "the attribute definition has a setter");
    assert.ok(typeof comp.attr('id').get === 'function', "the attribute definition has a getter");
});

QUnit.test('definition type casting', 6, function(assert){

    var comp = fwc();

    var mock = {
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

QUnit.test('multiple declarations', 3, function(assert){

    var comp = fwc();

    assert.ok(typeof comp.attrs === 'function', "the component definition holds the method attrs");
    assert.equal(comp.attrs('id', 'selected'), comp, "The method chains with arguments");
    assert.deepEqual(comp.attrs(), ['id', 'selected'], "the method returns values without arguments");
});

QUnit.test('accessors', 13, function(assert){

    var comp = fwc();

    var mock = {
        getAttribute(name){
            return this[name];
        },
        setAttribute(name, val){
            this[name] = val;
            return val;
        }
    };

    var testAccessors = {
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

    comp.attrs('id');
    assert.ok(typeof comp.access('id') === 'object', "Attributes have default accessors");
    assert.ok(typeof comp.access('foo') === 'undefined', "Only attributes have default accessors");
    assert.ok(typeof comp.access('id').get === 'function', "The method returns the accessors without arguments");
    assert.ok(typeof comp.access('id').set === 'function', "The method returns the accessors without arguments");

    assert.equal(comp.access('id').set.call(mock, 'bee'), 'bee', "The setter returns the defined value");
    assert.equal(comp.access('id').get.call(mock), 'bee', "The getter returns the defined value");
});


QUnit.module('Content');

QUnit.test('basic content', 6, function(assert){

    var comp = fwc();

    assert.ok(typeof comp.content === 'function', "the component definition holds the method content");

    assert.equal(comp.content('test'), comp, "The method set and chains with arguments");
    assert.ok(typeof comp.content() === 'function', "The method returns the function without arguments");
    assert.equal(comp.content().call(), 'test', "The content function returns the string set");

    comp.content(function template(data){
        return `<p>${data.foo}</p>`;
    });
    var content = comp.content();
    assert.ok(typeof content === 'function', "The method return the set function without arguments");
    assert.equal(content({ foo: 'bar'}), '<p>bar</p>', "The function replace the content data");
});


QUnit.test('handlebar template content', 2, function(assert){

    var comp = fwc();

    //template is handled externally, by browserify
    comp.content(require('./test.tpl'));

    var content = comp.content();

    assert.ok(typeof content === 'function', "The method return the set function without arguments");
    assert.equal(content({ foo: 'bar'}).trim(), '<span>bar</span>', "The function replace the content data");
});
