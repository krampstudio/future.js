var events = require('../../src/events.js');

QUnit.test("api", 3, function(assert){
    assert.ok(typeof events !== 'undefined', "The module exports something");
    assert.ok(typeof events === 'object', "The module exports an object");
    assert.ok(typeof events.eventify === 'function', "The module has an eventify method");
});

QUnit.asyncTest("eventify", 9, function(assert){

    var emitter = events.eventify();

    assert.ok(typeof emitter === 'object', "the emitter definition is an object");
    assert.ok(typeof emitter.on === 'function', "the emitter defintion holds the method on");
    assert.ok(typeof emitter.once === 'function', "the emitter defintion holds the method once");
    assert.ok(typeof emitter.trigger === 'function', "the emitter defintion holds the method trigger");
    assert.ok(typeof emitter.off === 'function', "the emitter defintion holds the method off");
    assert.ok(typeof emitter.emit === 'function', "the emitter defintion holds the method emit");
    assert.ok(typeof emitter.addListener === 'function', "the emitter defintion holds the method addListener");
    assert.ok(typeof emitter.removeListener === 'function', "the emitter defintion holds the method removeListener");

    emitter.on('foo', function(bar) {
        assert.equal(bar, 'bar', "The event is trigerred with the parameters");
        QUnit.start();
    });
    emitter.trigger('foo', 'bar');
});

//QUnit.asyncTest("event parameters", 3, function(assert){

//});

QUnit.module('natives');

QUnit.asyncTest("emit", 5, function(assert){

    var fixture = document.getElementById('qunit-fixture');
    var link    = fixture.querySelector('.link');

    assert.ok(link instanceof HTMLAnchorElement, "The link anchor is present");

    var emitter = events.eventify({}, true);

    link.addEventListener('click', (e) => {
        assert.ok(typeof e === 'object', "We have got the event");
        assert.deepEqual(e.target, link, "The event target is the link");
        assert.equal(e.bubbles, true, "The event bubbles");
        assert.equal(e.cancelable, true, "The event is cancelable");
        QUnit.start();
    });

    emitter.trigger('click', link);
});
