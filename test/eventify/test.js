import '../sauce.js';
import QUnit from 'qunitjs';
import eventify from 'eventify';


QUnit.module('eventify');

QUnit.test("api", assert => {
    assert.expect(2);

    assert.ok(typeof eventify !== 'undefined', "The module exports something");
    assert.ok(typeof eventify === 'function', "The module has an eventify method");
});


QUnit.module('eventification');

QUnit.test("delegates", assert => {
    assert.expect(5);

    let emitter = eventify();

    assert.ok(typeof emitter === 'object', "the emitter definition is an object");
    assert.ok(typeof emitter.on === 'function', "the emitter defintion holds the method on");
    assert.ok(typeof emitter.trigger === 'function', "the emitter defintion holds the method trigger");
    assert.ok(typeof emitter.off === 'function', "the emitter defintion holds the method off");
    assert.ok(typeof emitter.events === 'function', "the emitter defintion holds the method eventify");
});

QUnit.test("listen and trigger with params", assert => {
    assert.expect(3);

    let done = assert.async();

    let emitter = eventify();
    let params = ['bar', 'baz'];

    emitter.on('foo', (...args)  => {
        assert.ok(true, "The foo event is triggered on emitter");
        assert.deepEqual(args, params, "The event parameters are correct");
        done();
    });

    assert.equal(emitter.events('foo').length, 1, "Emitter has one foo event handler registered");

    emitter.trigger('foo', ...params);
});

QUnit.test("on context", assert => {
    assert.expect(3);

    let emitter1 = eventify();
    let emitter2 = eventify();

    assert.notDeepEqual(emitter1, emitter2, "Emitters are different objects");
    emitter1.on('foo', () => {});
    emitter2.on('foo', () => {});

    assert.equal(emitter1.events('foo').length, 1, "Emitter 1 has one event handler registered");
    assert.equal(emitter2.events('foo').length, 1, "Emitter 2 has one event handler registered");
});

QUnit.test("trigger context", assert => {
    assert.expect(2);

    let done1 = assert.async();
    let done2 = assert.async();

    let emitter1 = eventify();
    let emitter2 = eventify();

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
