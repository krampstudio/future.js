(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var router = require('router');

QUnit.module('API');

QUnit.test('module', 2, function (assert) {
    assert.ok(typeof router !== 'undefined', 'The module exports something');
    assert.ok(typeof router === 'function', 'The module exports a function');
});

QUnit.test('factory', 6, function (assert) {

    var routing = router();

    assert.ok(typeof routing === 'object', 'the router definition is an object');
    assert.ok(typeof routing.add === 'function', 'the router has got the method register');
    assert.ok(typeof routing.register === 'function', 'the router has got the method register');
    assert.ok(typeof routing.load === 'function', 'the router has got the method register');
    assert.ok(typeof routing.resolve === 'function', 'the router has got the method register');
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

QUnit.module('routes');

QUnit.test('config', 4, function (assert) {

    assert.throws(function () {
        return router([{}]);
    }, TypeError, 'Empty route');
    assert.throws(function () {
        return router([{ 'foo': 'bar' }]);
    }, TypeError, 'Wrong route');
    assert.throws(function () {
        return router([{ 'url': '/foo' }]);
    }, TypeError, 'Missing action');

    var routing = router([{
        'url': '/foo',
        'register': './comp.js'
    }]);

    assert.ok(typeof routing === 'object', 'the router is an object');
});

QUnit.test('resolve', 3, function (assert) {

    var loaded = false;
    var load = function load() {
        loaded = true;
    };

    var routing = router([{
        url: '/foo',
        load: load
    }]);

    assert.ok(typeof routing === 'object', 'the router is an object');
    assert.equal(loaded, false, 'the route is not resolved');

    routing.resolve('/foo');

    assert.equal(loaded, true, 'the route is now resolved');
});

QUnit.test('resolve', 11, function (assert) {

    var route = false;
    var route1 = function route1() {
        return route = 1;
    };
    var route2 = function route2() {
        return route = 2;
    };
    var route3 = function route3() {
        return route = 3;
    };

    var routing = router([{
        url: '/foo',
        load: route1
    }, {
        url: '/bar/*',
        load: route2
    }, {
        url: '/baz/:id/baz',
        load: route3
    }]);

    assert.ok(typeof routing === 'object', 'the router is an object');
    assert.equal(route, false, 'the route is not resolved');

    route = false;
    routing.resolve('/moo');
    assert.equal(route, false, '/moo : no route is resolved');

    route = false;
    routing.resolve('/foo');
    assert.equal(route, 1, '/foo : route 1 is resolved');

    route = false;
    routing.resolve('/foo/moo');
    assert.equal(route, false, '/foo/moo : no  route resolved');

    route = false;
    routing.resolve('/bar');
    assert.equal(route, false, '/bar : no route resolved');

    route = false;
    routing.resolve('/bar/bor');
    assert.equal(route, 2, 'the route 2 is resolved');

    route = false;
    routing.resolve('/bari/bor');
    assert.equal(route, false, '/bari/bor : no route resolved');

    route = false;
    routing.resolve('/baz/123/baz');
    assert.equal(route, 3, '/baz/123/baz : route 3 is resolved');

    route = false;
    routing.resolve('/baz/foo/baz');
    assert.equal(route, 3, '/baz/foo/baz : route 3 is resolved');

    route = false;
    routing.resolve('/bazfoo/123/baz');
    assert.equal(route, false, '/bazfoo/123/baz : no route resolved');
});

},{"router":"router"}]},{},[1])
//# sourceMappingURL=test.bundle.js.map
