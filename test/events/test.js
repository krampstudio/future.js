var events = require('eventify');

QUnit.module('events');

QUnit.test("api", 3, function(assert){
    assert.ok(typeof events !== 'undefined', "The module exports something");
    assert.ok(typeof events === 'object', "The module exports an object");
    assert.ok(typeof events.eventify === 'function', "The module has an eventify method");
});


QUnit.module('events.eventify');

QUnit.test("delegates", 5, function(assert){

    var emitter = events.eventify();

    assert.ok(typeof emitter === 'object', "the emitter definition is an object");
    assert.ok(typeof emitter.on === 'function', "the emitter defintion holds the method on");
    assert.ok(typeof emitter.trigger === 'function', "the emitter defintion holds the method trigger");
    assert.ok(typeof emitter.off === 'function', "the emitter defintion holds the method off");
    assert.ok(typeof emitter.events === 'function', "the emitter defintion holds the method events");
});

QUnit.test("listen and trigger with params", 3, function(assert){
    var done = assert.async();

    var emitter = events.eventify();
    var params = ['bar', 'baz'];

    emitter.on('foo', (...args)  => {
        assert.ok(true, "The foo event is triggered on emitter");
        assert.deepEqual(args, params, "The event parameters are correct");
        done();
    });

    assert.equal(emitter.events('foo').length, 1, "Emitter has one foo event handler registered");

    emitter.trigger('foo', ...params);
});

QUnit.test("on context", 3, function(assert){

    var emitter1 = events.eventify();
    var emitter2 = events.eventify();

    assert.notDeepEqual(emitter1, emitter2, "Emitters are different objects");
    emitter1.on('foo', () => {});
    emitter2.on('foo', () => {});

    assert.equal(emitter1.events('foo').length, 1, "Emitter 1 has one event handler registered");
    assert.equal(emitter2.events('foo').length, 1, "Emitter 2 has one event handler registered");
});


QUnit.test("trigger context", 2, function(assert){
    var done1 = assert.async();
    var done2 = assert.async();

    var emitter1 = events.eventify();
    var emitter2 = events.eventify();

    emitter1.on('foo', success => {
        assert.ok(success, "The foo event is triggered on emitter1");
        done1();
    });
    emitter2.on('foo', success => {
        assert.ok(success, "The foo event is triggered on emitter2");
        done2();
    });

    emitter1.trigger('foo', true);
    emitter2.trigger('foo', true);
});
