(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var eventify = require('eventify');

QUnit.module('eventify');

QUnit.test("api", 2, function (assert) {
    assert.ok(typeof eventify !== 'undefined', "The module exports something");
    assert.ok(typeof eventify === 'function', "The module has an eventify method");
});

QUnit.module('eventification');

QUnit.test("delegates", 5, function (assert) {

    var emitter = eventify();

    assert.ok(typeof emitter === 'object', "the emitter definition is an object");
    assert.ok(typeof emitter.on === 'function', "the emitter defintion holds the method on");
    assert.ok(typeof emitter.trigger === 'function', "the emitter defintion holds the method trigger");
    assert.ok(typeof emitter.off === 'function', "the emitter defintion holds the method off");
    assert.ok(typeof emitter.events === 'function', "the emitter defintion holds the method eventify");
});

QUnit.test("listen and trigger with params", 3, function (assert) {
    var done = assert.async();

    var emitter = eventify();
    var params = ['bar', 'baz'];

    emitter.on('foo', function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        assert.ok(true, "The foo event is triggered on emitter");
        assert.deepEqual(args, params, "The event parameters are correct");
        done();
    });

    assert.equal(emitter.events('foo').length, 1, "Emitter has one foo event handler registered");

    emitter.trigger.apply(emitter, ['foo'].concat(params));
});

QUnit.test("on context", 3, function (assert) {

    var emitter1 = eventify();
    var emitter2 = eventify();

    assert.notDeepEqual(emitter1, emitter2, "Emitters are different objects");
    emitter1.on('foo', function () {});
    emitter2.on('foo', function () {});

    assert.equal(emitter1.events('foo').length, 1, "Emitter 1 has one event handler registered");
    assert.equal(emitter2.events('foo').length, 1, "Emitter 2 has one event handler registered");
});

QUnit.test("trigger context", 2, function (assert) {
    var done1 = assert.async();
    var done2 = assert.async();

    var emitter1 = eventify();
    var emitter2 = eventify();

    emitter1.on('foo', function (success) {
        assert.ok(success, "The foo event is triggered on emitter1");
        done1();
    });
    emitter2.on('foo', function (success) {
        assert.ok(success, "The foo event is triggered on emitter2");
        done2();
    });

    emitter1.trigger('foo', true);
    emitter2.trigger('foo', true);
});

},{"eventify":"eventify"}]},{},[1])
//# sourceMappingURL=test.bundle.js.map
