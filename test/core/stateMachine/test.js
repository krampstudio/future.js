import '../../sauce.js';
import QUnit from 'qunitjs';
import stateMachine from '../../../src/core/stateMachine.js';


QUnit.module('API');

QUnit.test('module', assert => {
    assert.expect(2);

    assert.ok(typeof stateMachine !== 'undefined', 'The module exports something');
    assert.ok(typeof stateMachine === 'function',  'The module exports a function');
});

QUnit.test('factory', assert => {
    assert.expect(8);

    let state = stateMachine();

    assert.ok(typeof state === 'object',          'the state definition is an object');
    assert.ok(typeof state.list === 'function',   'the state has got the method list');
    assert.ok(typeof state.set === 'function',    'the state has got the method set');
    assert.ok(typeof state.toggle === 'function', 'the state has got the method toggle');
    assert.ok(typeof state.is === 'function',     'the state has got the method is');
    assert.ok(typeof state.remove === 'function', 'the state has got the method remove');
    assert.ok(typeof state.clear === 'function',  'the state has got the method clear');
    assert.notDeepEqual(state, stateMachine(),    'the state is a factory and creates an new state instance');
});


QUnit.module('state');

QUnit.test('define states', assert => {
    assert.expect(6);

    assert.throws( () => stateMachine(true), TypeError, 'Boolean are not valid states');
    assert.throws( () => stateMachine(12), TypeError, 'Numbers are not valid states');
    assert.throws( () => stateMachine(null), TypeError, 'null is not valid states');
    assert.throws( () => stateMachine({}), TypeError, 'Objects are not valid states');
    assert.throws( () => stateMachine([]), TypeError, 'Arrays are not valid states');
    assert.throws( () => stateMachine('foo', false), TypeError, 'Booleans are not valid states even in second arg');

    stateMachine('foo', 'bar');
});

QUnit.test('list enabled states', assert => {

    assert.expect(3);

    let states = ['foo', 'bar', 'baz'];
    let state = stateMachine(...states);

    assert.deepEqual(state.list(), states, 'Available states are those configured');

    states = ['foo', 'bar', 'foo'];
    state = stateMachine(...states);

    assert.notDeepEqual(state.list(), states, 'Available states are uniques');
    assert.deepEqual(state.list(), ['foo', 'bar'], 'Available states are those configured');
});


QUnit.test('set states', assert => {

    assert.expect(11);

    let states = ['foo', 'bar', 'baz', 'noz'];
    let state = stateMachine(...states);

    assert.deepEqual(state.list(), states, 'Available states are those configured');

    state.set('foo');
    assert.ok(state.is('foo'), 'the state is set');
    assert.ok( ! state.is('bar'), 'the state bar is not set');

    state.set('bar');
    assert.ok(state.is('foo'), 'the state foo is still set');
    assert.ok(state.is('bar'), 'the state bar is set');
    assert.ok( ! state.is('baz'), 'the state baz is not set');

    state.set('noz', 'baz', 'moo');
    assert.ok(state.is('foo'), 'the state foo is still set');
    assert.ok(state.is('bar'), 'the state bar is still set');
    assert.ok(state.is('baz'), 'the state bar is set');
    assert.ok(state.is('noz'), 'the state bar is set');
    assert.ok( ! state.is('moo'), 'the state moo is not set because not enabled');
});


QUnit.test('remove states', assert => {

    assert.expect(13);

    let states = ['foo', 'bar', 'baz', 'noz'];
    let state = stateMachine(...states);

    assert.deepEqual(state.list(), states, 'Available states are those configured');

    state.set('foo', 'bar', 'baz');
    assert.ok(state.is('foo'), 'the state foo is set');
    assert.ok(state.is('bar'), 'the state bar is set');
    assert.ok(state.is('baz'), 'the state baz is set');
    assert.ok( ! state.is('noz'), 'the state noz is not set');

    state.remove('bar');
    assert.ok(state.is('foo'), 'the state foo is still set');
    assert.ok( ! state.is('bar'), 'the state bar is not set anymore');
    assert.ok(state.is('baz'), 'the state baz is still set');
    assert.ok( ! state.is('noz'), 'the state noz is still not set');

    state.remove('foo', 'baz');
    assert.ok( ! state.is('foo'), 'the state foo is not set anymore');
    assert.ok( ! state.is('bar'), 'the state bar is not set anymore');
    assert.ok( ! state.is('baz'), 'the state baz is not set anymore');
    assert.ok( ! state.is('noz'), 'the state noz is still not set');
});


QUnit.test('clear states', assert => {

    assert.expect(9);

    let states = ['foo', 'bar', 'baz', 'noz'];
    let state = stateMachine(...states);

    assert.deepEqual(state.list(), states, 'Available states are those configured');

    state.set('foo', 'bar', 'baz');
    assert.ok(state.is('foo'), 'the state foo is set');
    assert.ok(state.is('bar'), 'the state bar is set');
    assert.ok(state.is('baz'), 'the state baz is set');
    assert.ok( ! state.is('noz'), 'the state noz is not set');

    state.clear();
    assert.ok( ! state.is('foo'), 'the state foo is now cleared');
    assert.ok( ! state.is('bar'), 'the state bar is now cleared');
    assert.ok( ! state.is('baz'), 'the state baz is now cleared');
    assert.ok( ! state.is('noz'), 'the state noz is now cleared');

});

QUnit.test('toggle states', assert => {

    assert.expect(11);

    let states = ['foo', 'bar', 'baz', 'noz'];
    let state = stateMachine(...states);

    assert.deepEqual(state.list(), states, 'Available states are those configured');

    state.set('foo', 'bar', 'baz');
    assert.ok(state.is('foo'), 'the state foo is set');
    assert.ok(state.is('bar'), 'the state bar is set');
    assert.ok(state.is('baz'), 'the state baz is set');
    assert.ok( ! state.is('noz'), 'the state noz is not set');

    state.toggle('foo');
    assert.ok( ! state.is('foo'), 'the state foo is now removed');

    state.toggle('foo');
    assert.ok(state.is('foo'), 'the state foo is now set');

    state.toggle('bar', 'noz');
    assert.ok( ! state.is('bar'), 'the state bar is now removed');
    assert.ok(state.is('noz'), 'the state noz is now set');

    state.toggle('bar', 'noz');
    assert.ok(state.is('bar'), 'the state bar is now set');
    assert.ok( ! state.is('noz'), 'the state noz is now removed');
});
