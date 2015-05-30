(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Helps you to make an object an event emitter
 * The API itself is just a placeholder, all methods will be delegated to a target.
 */
"use strict";

var api = {

    /**
     * Attach an handler to an event.
     * Calling `on` with the same eventName multiple times add callbacks: they
     * will all be executed.
     *
     * @example target.on('foo', bar => console.log('Cool ' + bar) );
     *
     * @this the target
     * @param {String} name - the name of the event to listen
     * @param {Function} handler - the callback to run once the event is triggered
     * @returns {Object} the target object
     */
    on: function on(name, handler) {
        if (typeof handler === "function") {
            this._events[name] = this._events[name] || [];
            this._events[name].push(handler);
        }
        return this;
    },

    /**
     * Remove ALL handlers for an event.
     *
     * @example target.off('foo');
     *
     * @this the target
     * @param {String} name - the name of the event
     * @returns {Object} the target object
     */
    off: function off(name) {
        this._events[name] = [];
        return this;
    },

    /**
     * Trigger an event.
     *
     * @example target.trigger('foo', 'Awesome');
     *
     * @this the target
     * @param {String} name - the name of the event to trigger
     * @param {*} data - arguments given to the handlers
     * @returns {Object} the target object
     */
    trigger: function trigger(name) {
        var _this = this;

        for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            data[_key - 1] = arguments[_key];
        }

        var self = this;
        if (this._events[name] && Array.isArray(this._events[name])) {
            this._events[name].forEach(function (event) {
                return event.call.apply(event, [_this].concat(data));
            });
        }
        return this;
    },

    /**
     * Get the registered handlers.
     *
     * @example target.events('foo').length;
     *
     * @this the target
     * @param {String} [name] - the name of the event
     * @returns {Array} the handlers
     */
    events: function events(name) {
        if (typeof name !== "undefined") {
            return this._events[name];
        }
        return this._events;
    }
};

/**
 * Makes the target an event emitter by delegating calls to the event API.
 * @param {Object} target - the target object
 * @returns {Object} the target
 */
function eventify() {
    var target = arguments[0] === undefined ? {} : arguments[0];

    target._events = {};

    Object.keys(api).filter(function (prop) {
        return typeof api[prop] === "function";
    }).forEach(function (method) {

        target[method] = function delegate() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return api[method].apply(target, args);
        };
    });
    return target;
}

module.exports = {
    eventify: eventify
};

},{}],2:[function(require,module,exports){
"use strict";

var events = require("../../src/events.js");

QUnit.module("events");

QUnit.test("api", 3, function (assert) {
    assert.ok(typeof events !== "undefined", "The module exports something");
    assert.ok(typeof events === "object", "The module exports an object");
    assert.ok(typeof events.eventify === "function", "The module has an eventify method");
});

QUnit.module("events.eventify");

QUnit.test("delegates", 5, function (assert) {

    var emitter = events.eventify();

    assert.ok(typeof emitter === "object", "the emitter definition is an object");
    assert.ok(typeof emitter.on === "function", "the emitter defintion holds the method on");
    assert.ok(typeof emitter.trigger === "function", "the emitter defintion holds the method trigger");
    assert.ok(typeof emitter.off === "function", "the emitter defintion holds the method off");
    assert.ok(typeof emitter.events === "function", "the emitter defintion holds the method events");
});

QUnit.test("listen and trigger with params", 3, function (assert) {
    var done = assert.async();

    var emitter = events.eventify();
    var params = ["bar", "baz"];

    emitter.on("foo", function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        assert.ok(true, "The foo event is triggered on emitter");
        assert.deepEqual(args, params, "The event parameters are correct");
        done();
    });

    assert.equal(emitter.events("foo").length, 1, "Emitter has one foo event handler registered");

    emitter.trigger.apply(emitter, ["foo"].concat(params));
});

QUnit.test("on context", 3, function (assert) {

    var emitter1 = events.eventify();
    var emitter2 = events.eventify();

    assert.notDeepEqual(emitter1, emitter2, "Emitters are different objects");
    emitter1.on("foo", function () {});
    emitter2.on("foo", function () {});

    assert.equal(emitter1.events("foo").length, 1, "Emitter 1 has one event handler registered");
    assert.equal(emitter2.events("foo").length, 1, "Emitter 2 has one event handler registered");
});

QUnit.test("trigger context", 2, function (assert) {
    var done1 = assert.async();
    var done2 = assert.async();

    var emitter1 = events.eventify();
    var emitter2 = events.eventify();

    emitter1.on("foo", function (success) {
        assert.ok(success, "The foo event is triggered on emitter1");
        done1();
    });
    emitter2.on("foo", function (success) {
        assert.ok(success, "The foo event is triggered on emitter2");
        done2();
    });

    emitter1.trigger("foo", true);
    emitter2.trigger("foo", true);
});

},{"../../src/events.js":1}]},{},[2])
//# sourceMappingURL=test.bundle.js.map
