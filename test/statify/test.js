import '../sauce.js';
import QUnit from 'qunitjs';
import statify from 'statify';


QUnit.module('API');

QUnit.test("module", assert => {
    assert.expect(2);

    assert.ok(typeof statify !== 'undefined', "The module exports something");
    assert.ok(typeof statify === 'function',  "The module exports a function");
});

QUnit.test("factory", assert => {
    assert.expect(5);

    let state = statify();

    assert.ok(typeof state === 'object',            "the state definition is an object");
    assert.ok(typeof state.list === 'function',     "the state has got the method add");
    assert.ok(typeof state.set === 'function',      "the state has got the method resolve");
    assert.ok(typeof state.is === 'function',       "the state has got the method resolve");
    assert.notDeepEqual(state, statify(),           "the state is a factory and creates an new state instance");
});


QUnit.module('statify');

QUnit.test("define states", assert => {
    assert.expect(6);

    assert.throws( e => statify(true), TypeError, 'Boolean are not valid states');
    assert.throws( e => statify(12), TypeError, 'Numbers are not valid states');
    assert.throws( e => statify(null), TypeError, 'null is not valid states');
    assert.throws( e => statify({}), TypeError, 'Objects are not valid states');
    assert.throws( e => statify([]), TypeError, 'Arrays are not valid states');
    assert.throws( e => statify('foo', false), TypeError, 'Booleans are not valid states even in second arg');

    statify('foo', 'bar');
});
