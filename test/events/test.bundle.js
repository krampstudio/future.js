(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/bertrand/dev/projects/future.js/src/events.js":[function(require,module,exports){
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

},{}],"/home/bertrand/dev/projects/future.js/test/events/test.js":[function(require,module,exports){
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

},{"../../src/events.js":"/home/bertrand/dev/projects/future.js/src/events.js"}]},{},["/home/bertrand/dev/projects/future.js/test/events/test.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9iZXJ0cmFuZC9kZXYvcHJvamVjdHMvZnV0dXJlLmpzL3NyYy9ldmVudHMuanMiLCIvaG9tZS9iZXJ0cmFuZC9kZXYvcHJvamVjdHMvZnV0dXJlLmpzL3Rlc3QvZXZlbnRzL3Rlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNJQSxJQUFJLEdBQUcsR0FBRzs7Ozs7Ozs7Ozs7Ozs7QUFjTixNQUFFLEVBQUEsWUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2IsWUFBRyxPQUFPLE9BQU8sS0FBSyxVQUFVLEVBQUM7QUFDN0IsZ0JBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDOUMsZ0JBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3BDO0FBQ0QsZUFBTyxJQUFJLENBQUM7S0FDZjs7Ozs7Ozs7Ozs7QUFXRCxPQUFHLEVBQUEsYUFBQyxJQUFJLEVBQUM7QUFDTCxZQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUN4QixlQUFPLElBQUksQ0FBQztLQUNmOzs7Ozs7Ozs7Ozs7QUFZRCxXQUFPLEVBQUcsaUJBQVMsSUFBSSxFQUFVOzs7MENBQUwsSUFBSTtBQUFKLGdCQUFJOzs7QUFDNUIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFlBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQztBQUN6RCxnQkFBSSxDQUFDLE9B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QyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDO0FBQzdGLFVBQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLDRDQUE0QyxDQUFDLENBQUM7Q0FDaEcsQ0FBQyxDQUFDOztBQUdILEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLFVBQVMsTUFBTSxFQUFDO0FBQzdDLFFBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMzQixRQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRTNCLFFBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNqQyxRQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRWpDLFlBQVEsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLFVBQUEsT0FBTyxFQUFJO0FBQzFCLGNBQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLHdDQUF3QyxDQUFDLENBQUM7QUFDN0QsYUFBSyxFQUFFLENBQUM7S0FDWCxDQUFDLENBQUM7QUFDSCxZQUFRLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxVQUFBLE9BQU8sRUFBSTtBQUMxQixjQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDO0FBQzdELGFBQUssRUFBRSxDQUFDO0tBQ1gsQ0FBQyxDQUFDOztBQUVILFlBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzlCLFlBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQ2pDLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEhlbHBzIHlvdSB0byBtYWtlIGFuIG9iamVjdCBhbiBldmVudCBlbWl0dGVyXG4gKiBUaGUgQVBJIGl0c2VsZiBpcyBqdXN0IGEgcGxhY2Vob2xkZXIsIGFsbCBtZXRob2RzIHdpbGwgYmUgZGVsZWdhdGVkIHRvIGEgdGFyZ2V0LlxuICovXG52YXIgYXBpID0ge1xuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIGFuIGhhbmRsZXIgdG8gYW4gZXZlbnQuXG4gICAgICogQ2FsbGluZyBgb25gIHdpdGggdGhlIHNhbWUgZXZlbnROYW1lIG11bHRpcGxlIHRpbWVzIGFkZCBjYWxsYmFja3M6IHRoZXlcbiAgICAgKiB3aWxsIGFsbCBiZSBleGVjdXRlZC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlIHRhcmdldC5vbignZm9vJywgYmFyID0+IGNvbnNvbGUubG9nKCdDb29sICcgKyBiYXIpICk7XG4gICAgICpcbiAgICAgKiBAdGhpcyB0aGUgdGFyZ2V0XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gbGlzdGVuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciAtIHRoZSBjYWxsYmFjayB0byBydW4gb25jZSB0aGUgZXZlbnQgaXMgdHJpZ2dlcmVkXG4gICAgICogQHJldHVybnMge09iamVjdH0gdGhlIHRhcmdldCBvYmplY3RcbiAgICAgKi9cbiAgICBvbihuYW1lLCBoYW5kbGVyKXtcbiAgICAgICAgaWYodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpe1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzW25hbWVdID0gdGhpcy5fZXZlbnRzW25hbWVdIHx8IFtdO1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRzW25hbWVdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBBTEwgaGFuZGxlcnMgZm9yIGFuIGV2ZW50LlxuICAgICAqXG4gICAgICogQGV4YW1wbGUgdGFyZ2V0Lm9mZignZm9vJyk7XG4gICAgICpcbiAgICAgKiBAdGhpcyB0aGUgdGFyZ2V0XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgZXZlbnRcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSB0aGUgdGFyZ2V0IG9iamVjdFxuICAgICAqL1xuICAgIG9mZihuYW1lKXtcbiAgICAgICAgdGhpcy5fZXZlbnRzW25hbWVdID0gW107XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGFuIGV2ZW50LlxuICAgICAqXG4gICAgICogQGV4YW1wbGUgdGFyZ2V0LnRyaWdnZXIoJ2ZvbycsICdBd2Vzb21lJyk7XG4gICAgICpcbiAgICAgKiBAdGhpcyB0aGUgdGFyZ2V0XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gdHJpZ2dlclxuICAgICAqIEBwYXJhbSB7Kn0gZGF0YSAtIGFyZ3VtZW50cyBnaXZlbiB0byB0aGUgaGFuZGxlcnNcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSB0aGUgdGFyZ2V0IG9iamVjdFxuICAgICAqL1xuICAgIHRyaWdnZXIgOiBmdW5jdGlvbihuYW1lLCAuLi5kYXRhKXtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZih0aGlzLl9ldmVudHNbbmFtZV0gJiYgQXJyYXkuaXNBcnJheSh0aGlzLl9ldmVudHNbbmFtZV0pKXtcbiAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0uZm9yRWFjaChldmVudCA9PiAgZXZlbnQuY2FsbCh0aGlzLCAuLi5kYXRhKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgcmVnaXN0ZXJlZCBoYW5kbGVycy5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlIHRhcmdldC5ldmVudHMoJ2ZvbycpLmxlbmd0aDtcbiAgICAgKlxuICAgICAqIEB0aGlzIHRoZSB0YXJnZXRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW25hbWVdIC0gdGhlIG5hbWUgb2YgdGhlIGV2ZW50XG4gICAgICogQHJldHVybnMge0FycmF5fSB0aGUgaGFuZGxlcnNcbiAgICAgKi9cbiAgICBldmVudHMgKG5hbWUpe1xuICAgICAgICBpZih0eXBlb2YgbmFtZSAhPT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZXZlbnRzO1xuICAgIH1cbn07XG5cbi8qKlxuICogTWFrZXMgdGhlIHRhcmdldCBhbiBldmVudCBlbWl0dGVyIGJ5IGRlbGVnYXRpbmcgY2FsbHMgdG8gdGhlIGV2ZW50IEFQSS5cbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXQgLSB0aGUgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybnMge09iamVjdH0gdGhlIHRhcmdldFxuICovXG5mdW5jdGlvbiBldmVudGlmeSh0YXJnZXQgPSB7fSl7XG5cbiAgICB0YXJnZXQuX2V2ZW50cyA9IHt9O1xuXG4gICAgT2JqZWN0XG4gICAgICAgIC5rZXlzKGFwaSlcbiAgICAgICAgLmZpbHRlciggcHJvcCA9PiB0eXBlb2YgYXBpW3Byb3BdID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAuZm9yRWFjaCggbWV0aG9kID0+IHtcblxuICAgICAgICAgICAgdGFyZ2V0W21ldGhvZF0gPSBmdW5jdGlvbiBkZWxlZ2F0ZSguLi5hcmdzKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXBpW21ldGhvZF0uYXBwbHkodGFyZ2V0LCBhcmdzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICB9KTtcbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBldmVudGlmeVxufTtcbiIsInZhciBldmVudHMgPSByZXF1aXJlKCcuLi8uLi9zcmMvZXZlbnRzLmpzJyk7XG5cblFVbml0Lm1vZHVsZSgnZXZlbnRzJyk7XG5cblFVbml0LnRlc3QoXCJhcGlcIiwgMywgZnVuY3Rpb24oYXNzZXJ0KXtcbiAgICBhc3NlcnQub2sodHlwZW9mIGV2ZW50cyAhPT0gJ3VuZGVmaW5lZCcsIFwiVGhlIG1vZHVsZSBleHBvcnRzIHNvbWV0aGluZ1wiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGV2ZW50cyA9PT0gJ29iamVjdCcsIFwiVGhlIG1vZHVsZSBleHBvcnRzIGFuIG9iamVjdFwiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGV2ZW50cy5ldmVudGlmeSA9PT0gJ2Z1bmN0aW9uJywgXCJUaGUgbW9kdWxlIGhhcyBhbiBldmVudGlmeSBtZXRob2RcIik7XG59KTtcblxuXG5RVW5pdC5tb2R1bGUoJ2V2ZW50cy5ldmVudGlmeScpO1xuXG5RVW5pdC50ZXN0KFwiZGVsZWdhdGVzXCIsIDUsIGZ1bmN0aW9uKGFzc2VydCl7XG5cbiAgICB2YXIgZW1pdHRlciA9IGV2ZW50cy5ldmVudGlmeSgpO1xuXG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBlbWl0dGVyID09PSAnb2JqZWN0JywgXCJ0aGUgZW1pdHRlciBkZWZpbml0aW9uIGlzIGFuIG9iamVjdFwiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGVtaXR0ZXIub24gPT09ICdmdW5jdGlvbicsIFwidGhlIGVtaXR0ZXIgZGVmaW50aW9uIGhvbGRzIHRoZSBtZXRob2Qgb25cIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBlbWl0dGVyLnRyaWdnZXIgPT09ICdmdW5jdGlvbicsIFwidGhlIGVtaXR0ZXIgZGVmaW50aW9uIGhvbGRzIHRoZSBtZXRob2QgdHJpZ2dlclwiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGVtaXR0ZXIub2ZmID09PSAnZnVuY3Rpb24nLCBcInRoZSBlbWl0dGVyIGRlZmludGlvbiBob2xkcyB0aGUgbWV0aG9kIG9mZlwiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGVtaXR0ZXIuZXZlbnRzID09PSAnZnVuY3Rpb24nLCBcInRoZSBlbWl0dGVyIGRlZmludGlvbiBob2xkcyB0aGUgbWV0aG9kIGV2ZW50c1wiKTtcbn0pO1xuXG5RVW5pdC50ZXN0KFwibGlzdGVuIGFuZCB0cmlnZ2VyIHdpdGggcGFyYW1zXCIsIDMsIGZ1bmN0aW9uKGFzc2VydCl7XG4gICAgdmFyIGRvbmUgPSBhc3NlcnQuYXN5bmMoKTtcblxuICAgIHZhciBlbWl0dGVyID0gZXZlbnRzLmV2ZW50aWZ5KCk7XG4gICAgdmFyIHBhcmFtcyA9IFsnYmFyJywgJ2JheiddO1xuXG4gICAgZW1pdHRlci5vbignZm9vJywgKC4uLmFyZ3MpICA9PiB7XG4gICAgICAgIGFzc2VydC5vayh0cnVlLCBcIlRoZSBmb28gZXZlbnQgaXMgdHJpZ2dlcmVkIG9uIGVtaXR0ZXJcIik7XG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwoYXJncywgcGFyYW1zLCBcIlRoZSBldmVudCBwYXJhbWV0ZXJzIGFyZSBjb3JyZWN0XCIpO1xuICAgICAgICBkb25lKCk7XG4gICAgfSk7XG5cbiAgICBhc3NlcnQuZXF1YWwoZW1pdHRlci5ldmVudHMoJ2ZvbycpLmxlbmd0aCwgMSwgXCJFbWl0dGVyIGhhcyBvbmUgZm9vIGV2ZW50IGhhbmRsZXIgcmVnaXN0ZXJlZFwiKTtcblxuICAgIGVtaXR0ZXIudHJpZ2dlcignZm9vJywgLi4ucGFyYW1zKTtcbn0pO1xuXG5RVW5pdC50ZXN0KFwib24gY29udGV4dFwiLCAzLCBmdW5jdGlvbihhc3NlcnQpe1xuXG4gICAgdmFyIGVtaXR0ZXIxID0gZXZlbnRzLmV2ZW50aWZ5KCk7XG4gICAgdmFyIGVtaXR0ZXIyID0gZXZlbnRzLmV2ZW50aWZ5KCk7XG5cbiAgICBhc3NlcnQubm90RGVlcEVxdWFsKGVtaXR0ZXIxLCBlbWl0dGVyMiwgXCJFbWl0dGVycyBhcmUgZGlmZmVyZW50IG9iamVjdHNcIik7XG4gICAgZW1pdHRlcjEub24oJ2ZvbycsICgpID0+IHt9KTtcbiAgICBlbWl0dGVyMi5vbignZm9vJywgKCkgPT4ge30pO1xuXG4gICAgYXNzZXJ0LmVxdWFsKGVtaXR0ZXIxLmV2ZW50cygnZm9vJykubGVuZ3RoLCAxLCBcIkVtaXR0ZXIgMSBoYXMgb25lIGV2ZW50IGhhbmRsZXIgcmVnaXN0ZXJlZFwiKTtcbiAgICBhc3NlcnQuZXF1YWwoZW1pdHRlcjIuZXZlbnRzKCdmb28nKS5sZW5ndGgsIDEsIFwiRW1pdHRlciAyIGhhcyBvbmUgZXZlbnQgaGFuZGxlciByZWdpc3RlcmVkXCIpO1xufSk7XG5cblxuUVVuaXQudGVzdChcInRyaWdnZXIgY29udGV4dFwiLCAyLCBmdW5jdGlvbihhc3NlcnQpe1xuICAgIHZhciBkb25lMSA9IGFzc2VydC5hc3luYygpO1xuICAgIHZhciBkb25lMiA9IGFzc2VydC5hc3luYygpO1xuXG4gICAgdmFyIGVtaXR0ZXIxID0gZXZlbnRzLmV2ZW50aWZ5KCk7XG4gICAgdmFyIGVtaXR0ZXIyID0gZXZlbnRzLmV2ZW50aWZ5KCk7XG5cbiAgICBlbWl0dGVyMS5vbignZm9vJywgc3VjY2VzcyA9PiB7XG4gICAgICAgIGFzc2VydC5vayhzdWNjZXNzLCBcIlRoZSBmb28gZXZlbnQgaXMgdHJpZ2dlcmVkIG9uIGVtaXR0ZXIxXCIpO1xuICAgICAgICBkb25lMSgpO1xuICAgIH0pO1xuICAgIGVtaXR0ZXIyLm9uKCdmb28nLCBzdWNjZXNzID0+IHtcbiAgICAgICAgYXNzZXJ0Lm9rKHN1Y2Nlc3MsIFwiVGhlIGZvbyBldmVudCBpcyB0cmlnZ2VyZWQgb24gZW1pdHRlcjJcIik7XG4gICAgICAgIGRvbmUyKCk7XG4gICAgfSk7XG5cbiAgICBlbWl0dGVyMS50cmlnZ2VyKCdmb28nLCB0cnVlKTtcbiAgICBlbWl0dGVyMi50cmlnZ2VyKCdmb28nLCB0cnVlKTtcbn0pO1xuIl19
