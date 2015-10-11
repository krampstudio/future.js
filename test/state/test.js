import '../sauce.js';
import QUnit from 'qunitjs';
import stateFactory from 'state';


QUnit.module('API');

QUnit.test('module', assert => {
    assert.expect(2);

    assert.ok(typeof stateFactory !== 'undefined', 'The module exports something');
    assert.ok(typeof stateFactory === 'function',  'The module exports a function');
});

QUnit.test('factory', assert => {
    assert.expect(5);

    let state = stateFactory();

    assert.ok(typeof state === 'object',            'the state definition is an object');
    assert.ok(typeof state.list === 'function',     'the state has got the method add');
    assert.ok(typeof state.set === 'function',      'the state has got the method resolve');
    assert.ok(typeof state.is === 'function',       'the state has got the method resolve');
    assert.notDeepEqual(state, stateFactory(),           'the state is a factory and creates an new state instance');
});


QUnit.module('state');

QUnit.test('define states', assert => {
    assert.expect(6);

    assert.throws( () => stateFactory(true), TypeError, 'Boolean are not valid states');
    assert.throws( () => stateFactory(12), TypeError, 'Numbers are not valid states');
    assert.throws( () => stateFactory(null), TypeError, 'null is not valid states');
    assert.throws( () => stateFactory({}), TypeError, 'Objects are not valid states');
    assert.throws( () => stateFactory([]), TypeError, 'Arrays are not valid states');
    assert.throws( () => stateFactory('foo', false), TypeError, 'Booleans are not valid states even in second arg');

    stateFactory('foo', 'bar');
});
