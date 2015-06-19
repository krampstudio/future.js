(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var router = require('router');

QUnit.module('API');

QUnit.test('module', 2, function (assert) {
    assert.ok(typeof router !== 'undefined', 'The module exports something');
    assert.ok(typeof router === 'function', 'The module exports a function');
});

QUnit.test('factory', 3, function (assert) {

    var routing = router();

    assert.ok(typeof routing === 'object', 'the router definition is an object');
    assert.ok(typeof routing.register === 'function', 'the router has got the method register');
    assert.notDeepEqual(routing, router(), 'the router is a factory and creates an new router instance');
});

QUnit.test('is an event emitter', 5, function (assert) {

    var routing = router();

    assert.ok(typeof routing === 'object', 'the router is an object');
    assert.ok(typeof routing.on === 'function', 'the router has got method on');
    assert.ok(typeof routing.trigger === 'function', 'the router has got the method trigger');
    assert.ok(typeof routing.off === 'function', 'the router has got the method off');
    assert.ok(typeof routing.events === 'function', 'the router has got the method events');
});

},{"router":"router"}]},{},[1])
//# sourceMappingURL=test.bundle.js.map
