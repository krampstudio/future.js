(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var events = require('eventify');

QUnit.module('events');

QUnit.test('api', 3, function (assert) {
    assert.ok(typeof events !== 'undefined', 'The module exports something');
    assert.ok(typeof events === 'object', 'The module exports an object');
    assert.ok(typeof events.eventify === 'function', 'The module has an eventify method');
});

QUnit.module('events.eventify');

QUnit.test('delegates', 5, function (assert) {

    var emitter = events.eventify();

    assert.ok(typeof emitter === 'object', 'the emitter definition is an object');
    assert.ok(typeof emitter.on === 'function', 'the emitter defintion holds the method on');
    assert.ok(typeof emitter.trigger === 'function', 'the emitter defintion holds the method trigger');
    assert.ok(typeof emitter.off === 'function', 'the emitter defintion holds the method off');
    assert.ok(typeof emitter.events === 'function', 'the emitter defintion holds the method events');
});

QUnit.test('listen and trigger with params', 3, function (assert) {
    var done = assert.async();

    var emitter = events.eventify();
    var params = ['bar', 'baz'];

    emitter.on('foo', function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        assert.ok(true, 'The foo event is triggered on emitter');
        assert.deepEqual(args, params, 'The event parameters are correct');
        done();
    });

    assert.equal(emitter.events('foo').length, 1, 'Emitter has one foo event handler registered');

    emitter.trigger.apply(emitter, ['foo'].concat(params));
});

QUnit.test('on context', 3, function (assert) {

    var emitter1 = events.eventify();
    var emitter2 = events.eventify();

    assert.notDeepEqual(emitter1, emitter2, 'Emitters are different objects');
    emitter1.on('foo', function () {});
    emitter2.on('foo', function () {});

    assert.equal(emitter1.events('foo').length, 1, 'Emitter 1 has one event handler registered');
    assert.equal(emitter2.events('foo').length, 1, 'Emitter 2 has one event handler registered');
});

QUnit.test('trigger context', 2, function (assert) {
    var done1 = assert.async();
    var done2 = assert.async();

    var emitter1 = events.eventify();
    var emitter2 = events.eventify();

    emitter1.on('foo', function (success) {
        assert.ok(success, 'The foo event is triggered on emitter1');
        done1();
    });
    emitter2.on('foo', function (success) {
        assert.ok(success, 'The foo event is triggered on emitter2');
        done2();
    });

    emitter1.trigger('foo', true);
    emitter2.trigger('foo', true);
});

},{"eventify":"eventify"}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9iZXJ0cmFuZC9kZXYvcHJvamVjdHMvZnV0dXJlLmpzL3Rlc3QvZXZlbnRzL3Rlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFakMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFdkIsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVMsTUFBTSxFQUFDO0FBQ2pDLFVBQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVyxFQUFFLDhCQUE4QixDQUFDLENBQUM7QUFDekUsVUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUUsOEJBQThCLENBQUMsQ0FBQztBQUN0RSxVQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sTUFBTSxDQUFDLFFBQVEsS0FBSyxVQUFVLEVBQUUsbUNBQW1DLENBQUMsQ0FBQztDQUN6RixDQUFDLENBQUM7O0FBR0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDOztBQUVoQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsVUFBUyxNQUFNLEVBQUM7O0FBRXZDLFFBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7QUFFaEMsVUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUUscUNBQXFDLENBQUMsQ0FBQztBQUM5RSxVQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sT0FBTyxDQUFDLEVBQUUsS0FBSyxVQUFVLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztBQUN6RixVQUFNLENB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S0FBSyxFQUFFLFVBQUEsT0FBTyxFQUFJO0FBQzFCLGNBQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLHdDQUF3QyxDQUFDLENBQUM7QUFDN0QsYUFBSyxFQUFFLENBQUM7S0FDWCxDQUFDLENBQUM7O0FBRUgsWUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDOUIsWUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7Q0FDakMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBldmVudHMgPSByZXF1aXJlKCdldmVudGlmeScpO1xuXG5RVW5pdC5tb2R1bGUoJ2V2ZW50cycpO1xuXG5RVW5pdC50ZXN0KFwiYXBpXCIsIDMsIGZ1bmN0aW9uKGFzc2VydCl7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBldmVudHMgIT09ICd1bmRlZmluZWQnLCBcIlRoZSBtb2R1bGUgZXhwb3J0cyBzb21ldGhpbmdcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBldmVudHMgPT09ICdvYmplY3QnLCBcIlRoZSBtb2R1bGUgZXhwb3J0cyBhbiBvYmplY3RcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBldmVudHMuZXZlbnRpZnkgPT09ICdmdW5jdGlvbicsIFwiVGhlIG1vZHVsZSBoYXMgYW4gZXZlbnRpZnkgbWV0aG9kXCIpO1xufSk7XG5cblxuUVVuaXQubW9kdWxlKCdldmVudHMuZXZlbnRpZnknKTtcblxuUVVuaXQudGVzdChcImRlbGVnYXRlc1wiLCA1LCBmdW5jdGlvbihhc3NlcnQpe1xuXG4gICAgdmFyIGVtaXR0ZXIgPSBldmVudHMuZXZlbnRpZnkoKTtcblxuICAgIGFzc2VydC5vayh0eXBlb2YgZW1pdHRlciA9PT0gJ29iamVjdCcsIFwidGhlIGVtaXR0ZXIgZGVmaW5pdGlvbiBpcyBhbiBvYmplY3RcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBlbWl0dGVyLm9uID09PSAnZnVuY3Rpb24nLCBcInRoZSBlbWl0dGVyIGRlZmludGlvbiBob2xkcyB0aGUgbWV0aG9kIG9uXCIpO1xuICAgIGFzc2VydC5vayh0eXBlb2YgZW1pdHRlci50cmlnZ2VyID09PSAnZnVuY3Rpb24nLCBcInRoZSBlbWl0dGVyIGRlZmludGlvbiBob2xkcyB0aGUgbWV0aG9kIHRyaWdnZXJcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBlbWl0dGVyLm9mZiA9PT0gJ2Z1bmN0aW9uJywgXCJ0aGUgZW1pdHRlciBkZWZpbnRpb24gaG9sZHMgdGhlIG1ldGhvZCBvZmZcIik7XG4gICAgYXNzZXJ0Lm9rKHR5cGVvZiBlbWl0dGVyLmV2ZW50cyA9PT0gJ2Z1bmN0aW9uJywgXCJ0aGUgZW1pdHRlciBkZWZpbnRpb24gaG9sZHMgdGhlIG1ldGhvZCBldmVudHNcIik7XG59KTtcblxuUVVuaXQudGVzdChcImxpc3RlbiBhbmQgdHJpZ2dlciB3aXRoIHBhcmFtc1wiLCAzLCBmdW5jdGlvbihhc3NlcnQpe1xuICAgIHZhciBkb25lID0gYXNzZXJ0LmFzeW5jKCk7XG5cbiAgICB2YXIgZW1pdHRlciA9IGV2ZW50cy5ldmVudGlmeSgpO1xuICAgIHZhciBwYXJhbXMgPSBbJ2JhcicsICdiYXonXTtcblxuICAgIGVtaXR0ZXIub24oJ2ZvbycsICguLi5hcmdzKSAgPT4ge1xuICAgICAgICBhc3NlcnQub2sodHJ1ZSwgXCJUaGUgZm9vIGV2ZW50IGlzIHRyaWdnZXJlZCBvbiBlbWl0dGVyXCIpO1xuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsKGFyZ3MsIHBhcmFtcywgXCJUaGUgZXZlbnQgcGFyYW1ldGVycyBhcmUgY29ycmVjdFwiKTtcbiAgICAgICAgZG9uZSgpO1xuICAgIH0pO1xuXG4gICAgYXNzZXJ0LmVxdWFsKGVtaXR0ZXIuZXZlbnRzKCdmb28nKS5sZW5ndGgsIDEsIFwiRW1pdHRlciBoYXMgb25lIGZvbyBldmVudCBoYW5kbGVyIHJlZ2lzdGVyZWRcIik7XG5cbiAgICBlbWl0dGVyLnRyaWdnZXIoJ2ZvbycsIC4uLnBhcmFtcyk7XG59KTtcblxuUVVuaXQudGVzdChcIm9uIGNvbnRleHRcIiwgMywgZnVuY3Rpb24oYXNzZXJ0KXtcblxuICAgIHZhciBlbWl0dGVyMSA9IGV2ZW50cy5ldmVudGlmeSgpO1xuICAgIHZhciBlbWl0dGVyMiA9IGV2ZW50cy5ldmVudGlmeSgpO1xuXG4gICAgYXNzZXJ0Lm5vdERlZXBFcXVhbChlbWl0dGVyMSwgZW1pdHRlcjIsIFwiRW1pdHRlcnMgYXJlIGRpZmZlcmVudCBvYmplY3RzXCIpO1xuICAgIGVtaXR0ZXIxLm9uKCdmb28nLCAoKSA9PiB7fSk7XG4gICAgZW1pdHRlcjIub24oJ2ZvbycsICgpID0+IHt9KTtcblxuICAgIGFzc2VydC5lcXVhbChlbWl0dGVyMS5ldmVudHMoJ2ZvbycpLmxlbmd0aCwgMSwgXCJFbWl0dGVyIDEgaGFzIG9uZSBldmVudCBoYW5kbGVyIHJlZ2lzdGVyZWRcIik7XG4gICAgYXNzZXJ0LmVxdWFsKGVtaXR0ZXIyLmV2ZW50cygnZm9vJykubGVuZ3RoLCAxLCBcIkVtaXR0ZXIgMiBoYXMgb25lIGV2ZW50IGhhbmRsZXIgcmVnaXN0ZXJlZFwiKTtcbn0pO1xuXG5cblFVbml0LnRlc3QoXCJ0cmlnZ2VyIGNvbnRleHRcIiwgMiwgZnVuY3Rpb24oYXNzZXJ0KXtcbiAgICB2YXIgZG9uZTEgPSBhc3NlcnQuYXN5bmMoKTtcbiAgICB2YXIgZG9uZTIgPSBhc3NlcnQuYXN5bmMoKTtcblxuICAgIHZhciBlbWl0dGVyMSA9IGV2ZW50cy5ldmVudGlmeSgpO1xuICAgIHZhciBlbWl0dGVyMiA9IGV2ZW50cy5ldmVudGlmeSgpO1xuXG4gICAgZW1pdHRlcjEub24oJ2ZvbycsIHN1Y2Nlc3MgPT4ge1xuICAgICAgICBhc3NlcnQub2soc3VjY2VzcywgXCJUaGUgZm9vIGV2ZW50IGlzIHRyaWdnZXJlZCBvbiBlbWl0dGVyMVwiKTtcbiAgICAgICAgZG9uZTEoKTtcbiAgICB9KTtcbiAgICBlbWl0dGVyMi5vbignZm9vJywgc3VjY2VzcyA9PiB7XG4gICAgICAgIGFzc2VydC5vayhzdWNjZXNzLCBcIlRoZSBmb28gZXZlbnQgaXMgdHJpZ2dlcmVkIG9uIGVtaXR0ZXIyXCIpO1xuICAgICAgICBkb25lMigpO1xuICAgIH0pO1xuXG4gICAgZW1pdHRlcjEudHJpZ2dlcignZm9vJywgdHJ1ZSk7XG4gICAgZW1pdHRlcjIudHJpZ2dlcignZm9vJywgdHJ1ZSk7XG59KTtcbiJdfQ==
