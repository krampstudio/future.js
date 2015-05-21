(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/bertrand/dev/projects/future.js/node_modules/grunt-browserify/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],"/home/bertrand/dev/projects/future.js/src/events.js":[function(require,module,exports){
"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

/**
 * Helps you to make an object an event emitter
 */
var EventEmitter = require("events").EventEmitter;

//alias event emitter functions
var aliases = {
    trigger: "emit",
    off: "removeListener"
};

var natives = {
    addListener: function addListener(eventName, elt, handler) {
        return elt.addEventListener(eventName, handler, false);
    },
    emit: function emit(eventName, elt) {
        if (typeof window.Event === "function") {
            return elt.dispatchEvent(new Event(eventName, {
                cancelable: true,
                bubbles: true
            }));
        } else {
            var _event = document.createEvent("HTMLEvents");
            _event.initEvent(eventName, true, true);
            return elt.dispatchEvent(_event);
        }
    },
    removeListener: function removeListener(eventName, elt) {
        this.listeners().forEach(function (listener) {
            elt.removeEventListener(eventName, listener);
        });
    }
};

//list of methods to add to the target
var api = Object.keys(EventEmitter.prototype).filter(function (name) {
    return typeof EventEmitter.prototype[name] === "function";
}).reduce(function (acc, name) {
    acc[name] = name;
    return acc;
}, aliases);

var events = {
    /**
     * Makes the target an event emitter by delegating the api to an event emitter
     * @param {Object} target - the target object
     * @returns {Object} the target augmented of the event api
     */
    eventify: function eventify() {
        var target = arguments[0] === undefined ? {} : arguments[0];
        var delegateNative = arguments[1] === undefined ? false : arguments[1];

        var emitter = new EventEmitter();
        Object.keys(api).forEach(function (alias) {
            var method = api[alias];
            if (!target[alias]) {
                target[alias] = function delegate() {
                    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                    }

                    if (delegateNative && args.length > 1 && args[1] instanceof HTMLElement) {
                        var eventName = args[0];
                        var elt = args[1];
                        var rest = args.slice(2);

                        console.log("Delegate to native ");
                        console.log("method", method);
                        console.log("alias", alias);
                        console.log("event", eventName);
                        console.log("element", elt);
                        console.log("rest", rest);

                        if (typeof natives[method] === "function") {
                            var _natives$method;

                            (_natives$method = natives[method]).call.apply(_natives$method, [target, eventName, elt].concat(_toConsumableArray(rest)));
                        }
                    }
                    return emitter[method].apply(target, args);
                };
            }
        });
        return target;
    }
};
module.exports = events;

},{"events":"/home/bertrand/dev/projects/future.js/node_modules/grunt-browserify/node_modules/browserify/node_modules/events/events.js"}],"/home/bertrand/dev/projects/future.js/test/events/test.js":[function(require,module,exports){
"use strict";

var events = require("../../src/events.js");

QUnit.test("api", 3, function (assert) {
    assert.ok(typeof events !== "undefined", "The module exports something");
    assert.ok(typeof events === "object", "The module exports an object");
    assert.ok(typeof events.eventify === "function", "The module has an eventify method");
});

QUnit.asyncTest("eventify", 9, function (assert) {

    var emitter = events.eventify();

    assert.ok(typeof emitter === "object", "the emitter definition is an object");
    assert.ok(typeof emitter.on === "function", "the emitter defintion holds the method on");
    assert.ok(typeof emitter.once === "function", "the emitter defintion holds the method once");
    assert.ok(typeof emitter.trigger === "function", "the emitter defintion holds the method trigger");
    assert.ok(typeof emitter.off === "function", "the emitter defintion holds the method off");
    assert.ok(typeof emitter.emit === "function", "the emitter defintion holds the method emit");
    assert.ok(typeof emitter.addListener === "function", "the emitter defintion holds the method addListener");
    assert.ok(typeof emitter.removeListener === "function", "the emitter defintion holds the method removeListener");

    emitter.on("foo", function (bar) {
        assert.equal(bar, "bar", "The event is trigerred with the parameters");
        QUnit.start();
    });
    emitter.trigger("foo", "bar");
});

//QUnit.asyncTest("event parameters", 3, function(assert){

//});

QUnit.module("natives");

QUnit.asyncTest("emit", 5, function (assert) {

    var fixture = document.getElementById("qunit-fixture");
    var link = fixture.querySelector(".link");

    assert.ok(link instanceof HTMLAnchorElement, "The link anchor is present");

    var emitter = events.eventify({}, true);

    link.addEventListener("click", function (e) {
        assert.ok(typeof e === "object", "We have got the event");
        assert.deepEqual(e.target, link, "The event target is the link");
        assert.equal(e.bubbles, true, "The event bubbles");
        assert.equal(e.cancelable, true, "The event is cancelable");
        QUnit.start();
    });

    emitter.trigger("click", link);
});

},{"../../src/events.js":"/home/bertrand/dev/projects/future.js/src/events.js"}]},{},["/home/bertrand/dev/projects/future.js/test/events/test.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIi9ob21lL2JlcnRyYW5kL2Rldi9wcm9qZWN0cy9mdXR1cmUuanMvc3JjL2V2ZW50cy5qcyIsIi9ob21lL2JlcnRyYW5kL2Rldi9wcm9qZWN0cy9mdXR1cmUuanMvdGVzdC9ldmVudHMvdGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIvKipcbiAqIEhlbHBzIHlvdSB0byBtYWtlIGFuIG9iamVjdCBhbiBldmVudCBlbWl0dGVyXG4gKi9cbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XG5cbi8vYWxpYXMgZXZlbnQgZW1pdHRlciBmdW5jdGlvbnNcbnZhciBhbGlhc2VzID0ge1xuICAgIHRyaWdnZXI6ICdlbWl0JyxcbiAgICBvZmY6ICdyZW1vdmVMaXN0ZW5lcidcbn07XG5cbnZhciBuYXRpdmVzID0ge1xuICAgIGFkZExpc3RlbmVyKGV2ZW50TmFtZSwgZWx0LCBoYW5kbGVyKXtcbiAgICAgICAgcmV0dXJuIGVsdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0sXG4gICAgZW1pdChldmVudE5hbWUsIGVsdCl7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LkV2ZW50ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gZWx0LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KGV2ZW50TmFtZSwge1xuICAgICAgICAgICAgICAgIGNhbmNlbGFibGUgOiB0cnVlLFxuICAgICAgICAgICAgICAgIGJ1YmJsZXMgOiB0cnVlXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkhUTUxFdmVudHNcIik7XG4gICAgICAgICAgICBldmVudC5pbml0RXZlbnQoZXZlbnROYW1lLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybiBlbHQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlbW92ZUxpc3RlbmVyKGV2ZW50TmFtZSwgZWx0KXtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMoKS5mb3JFYWNoKCBsaXN0ZW5lciA9PiB7XG4gICAgICAgICAgICBlbHQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuLy9saXN0IG9mIG1ldGhvZHMgdG8gYWRkIHRvIHRoZSB0YXJnZXRcbnZhciBhcGkgPSBPYmplY3Qua2V5cyhFdmVudEVtaXR0ZXIucHJvdG90eXBlKVxuICAgIC5maWx0ZXIoIG5hbWUgPT4gdHlwZW9mIEV2ZW50RW1pdHRlci5wcm90b3R5cGVbbmFtZV0gPT09ICdmdW5jdGlvbicpXG4gICAgLnJlZHVjZSgoYWNjLCBuYW1lKSA9PiB7XG4gICAgICAgIGFjY1tuYW1lXSA9IG5hbWU7XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgYWxpYXNlcyk7XG5cblxudmFyIGV2ZW50cyA9IHtcbiAgICAvKipcbiAgICAgKiBNYWtlcyB0aGUgdGFyZ2V0IGFuIGV2ZW50IGVtaXR0ZXIgYnkgZGVsZWdhdGluZyB0aGUgYXBpIHRvIGFuIGV2ZW50IGVtaXR0ZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0IC0gdGhlIHRhcmdldCBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSB0aGUgdGFyZ2V0IGF1Z21lbnRlZCBvZiB0aGUgZXZlbnQgYXBpXG4gICAgICovXG4gICAgZXZlbnRpZnkodGFyZ2V0ID0ge30sIGRlbGVnYXRlTmF0aXZlID0gZmFsc2Upe1xuICAgICAgICB2YXIgZW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgT2JqZWN0LmtleXMoYXBpKS5mb3JFYWNoKCBhbGlhcyA9PiB7XG4gICAgICAgICAgICBsZXQgbWV0aG9kID0gYXBpW2FsaWFzXTtcbiAgICAgICAgICAgIGlmKCF0YXJnZXRbYWxpYXNdKXtcbiAgICAgICAgICAgICAgICB0YXJnZXRbYWxpYXNdID0gZnVuY3Rpb24gZGVsZWdhdGUoLi4uYXJncyl7XG4gICAgICAgICAgICAgICAgICAgIGlmKGRlbGVnYXRlTmF0aXZlICYmIGFyZ3MubGVuZ3RoID4gMSAmJiBhcmdzWzFdIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IFtldmVudE5hbWUsIGVsdCwgLi4ucmVzdF0gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0RlbGVnYXRlIHRvIG5hdGl2ZSAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdtZXRob2QnLCAgbWV0aG9kKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhbGlhcycsIGFsaWFzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdldmVudCcsIGV2ZW50TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZWxlbWVudCcsIGVsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygncmVzdCcsIHJlc3QpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZih0eXBlb2YgbmF0aXZlc1ttZXRob2RdID09PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmVzW21ldGhvZF0uY2FsbCh0YXJnZXQsIGV2ZW50TmFtZSwgZWx0LCAuLi5yZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW1pdHRlclttZXRob2RdLmFwcGx5KHRhcmdldCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gZXZlbnRzO1xuIiwidmFyIGV2ZW50cyA9IHJlcXVpcmUoJy4uLy4uL3NyYy9ldmVudHMuanMnKTtcblxuUVVuaXQudGVzdChcImFwaVwiLCAzLCBmdW5jdGlvbihhc3NlcnQpe1xuICAgIGFzc2VydC5vayh0eXBlb2YgZXZlbnRzICE9PSAndW5kZWZpbmVkJywgXCJUaGUgbW9kdWxlIGV4cG9ydHMgc29tZXRoaW5nXCIpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgZXZlbnRzID09PSAnb2JqZWN0JywgXCJUaGUgbW9kdWxlIGV4cG9ydHMgYW4gb2JqZWN0XCIpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgZXZlbnRzLmV2ZW50aWZ5ID09PSAnZnVuY3Rpb24nLCBcIlRoZSBtb2R1bGUgaGFzIGFuIGV2ZW50aWZ5IG1ldGhvZFwiKTtcbn0pO1xuXG5RVW5pdC5hc3luY1Rlc3QoXCJldmVudGlmeVwiLCA5LCBmdW5jdGlvbihhc3NlcnQpe1xuXG4gICAgdmFyIGVtaXR0ZXIgPSBldmVudHMuZXZlbnRpZnkoKTtcblxuICAgIGFzc2VydC5vayh0eXBlb2YgZW1pdHRlciA9PT0gJ29iamVjdCcsIFwidGhlIGVtaXR0ZXIgZGVmaW5pdGlvbiBpcyBhbiBvYmplY3RcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBlbWl0dGVyLm9uID09PSAnZnVuY3Rpb24nLCBcInRoZSBlbWl0dGVyIGRlZmludGlvbiBob2xkcyB0aGUgbWV0aG9kIG9uXCIpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgZW1pdHRlci5vbmNlID09PSAnZnVuY3Rpb24nLCBcInRoZSBlbWl0dGVyIGRlZmludGlvbiBob2xkcyB0aGUgbWV0aG9kIG9uY2VcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBlbWl0dGVyLnRyaWdnZXIgPT09ICdmdW5jdGlvbicsIFwidGhlIGVtaXR0ZXIgZGVmaW50aW9uIGhvbGRzIHRoZSBtZXRob2QgdHJpZ2dlclwiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGVtaXR0ZXIub2ZmID09PSAnZnVuY3Rpb24nLCBcInRoZSBlbWl0dGVyIGRlZmludGlvbiBob2xkcyB0aGUgbWV0aG9kIG9mZlwiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGVtaXR0ZXIuZW1pdCA9PT0gJ2Z1bmN0aW9uJywgXCJ0aGUgZW1pdHRlciBkZWZpbnRpb24gaG9sZHMgdGhlIG1ldGhvZCBlbWl0XCIpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgZW1pdHRlci5hZGRMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJywgXCJ0aGUgZW1pdHRlciBkZWZpbnRpb24gaG9sZHMgdGhlIG1ldGhvZCBhZGRMaXN0ZW5lclwiKTtcbiAgICBhc3NlcnQub2sodHlwZW9mIGVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIgPT09ICdmdW5jdGlvbicsIFwidGhlIGVtaXR0ZXIgZGVmaW50aW9uIGhvbGRzIHRoZSBtZXRob2QgcmVtb3ZlTGlzdGVuZXJcIik7XG5cbiAgICBlbWl0dGVyLm9uKCdmb28nLCBmdW5jdGlvbihiYXIpIHtcbiAgICAgICAgYXNzZXJ0LmVxdWFsKGJhciwgJ2JhcicsIFwiVGhlIGV2ZW50IGlzIHRyaWdlcnJlZCB3aXRoIHRoZSBwYXJhbWV0ZXJzXCIpO1xuICAgICAgICBRVW5pdC5zdGFydCgpO1xuICAgIH0pO1xuICAgIGVtaXR0ZXIudHJpZ2dlcignZm9vJywgJ2JhcicpO1xufSk7XG5cbi8vUVVuaXQuYXN5bmNUZXN0KFwiZXZlbnQgcGFyYW1ldGVyc1wiLCAzLCBmdW5jdGlvbihhc3NlcnQpe1xuXG4vL30pO1xuXG5RVW5pdC5tb2R1bGUoJ25hdGl2ZXMnKTtcblxuUVVuaXQuYXN5bmNUZXN0KFwiZW1pdFwiLCA1LCBmdW5jdGlvbihhc3NlcnQpe1xuXG4gICAgdmFyIGZpeHR1cmUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncXVuaXQtZml4dHVyZScpO1xuICAgIHZhciBsaW5rICAgID0gZml4dHVyZS5xdWVyeVNlbGVjdG9yKCcubGluaycpO1xuXG4gICAgYXNzZXJ0Lm9rKGxpbmsgaW5zdGFuY2VvZiBIVE1MQW5jaG9yRWxlbWVudCwgXCJUaGUgbGluayBhbmNob3IgaXMgcHJlc2VudFwiKTtcblxuICAgIHZhciBlbWl0dGVyID0gZXZlbnRzLmV2ZW50aWZ5KHt9LCB0cnVlKTtcblxuICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICBhc3NlcnQub2sodHlwZW9mIGUgPT09ICdvYmplY3QnLCBcIldlIGhhdmUgZ290IHRoZSBldmVudFwiKTtcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChlLnRhcmdldCwgbGluaywgXCJUaGUgZXZlbnQgdGFyZ2V0IGlzIHRoZSBsaW5rXCIpO1xuICAgICAgICBhc3NlcnQuZXF1YWwoZS5idWJibGVzLCB0cnVlLCBcIlRoZSBldmVudCBidWJibGVzXCIpO1xuICAgICAgICBhc3NlcnQuZXF1YWwoZS5jYW5jZWxhYmxlLCB0cnVlLCBcIlRoZSBldmVudCBpcyBjYW5jZWxhYmxlXCIpO1xuICAgICAgICBRVW5pdC5zdGFydCgpO1xuICAgIH0pO1xuXG4gICAgZW1pdHRlci50cmlnZ2VyKCdjbGljaycsIGxpbmspO1xufSk7XG4iXX0=
