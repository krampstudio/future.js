var fwc = require('../../src/fwc.js');

QUnit.module('Module');

QUnit.test('factory', 3, function(assert) {
    assert.ok(typeof fwc === 'function', "The module expose a function");
    assert.ok(typeof fwc() === 'object', "The module creates an object");
    assert.notEqual(fwc(), fwc(), "The factory creates a new object at each call");
});

QUnit.module('Events');

QUnit.asyncTest("emitter", 8, function(assert){

    var comp = fwc();

    assert.ok(typeof comp === 'object', "the component definition is an object");
    assert.ok(typeof comp.on === 'function', "the component defintion holds the method on");
    assert.ok(typeof comp.once === 'function', "the component defintion holds the method once");
    assert.ok(typeof comp.trigger === 'function', "the component defintion holds the method trigger");
    assert.ok(typeof comp.emit === 'function', "the component defintion holds the method emit");
    assert.ok(typeof comp.off === 'function', "the component defintion holds the method off");

    comp.on('error', function(e) {
        assert.ok(e instanceof Error, 'An error is emitted');
        assert.equal(e.message, 'test error', 'The message is given in the error');

        QUnit.start();
    });
    comp.emit('error', new Error('test error'));
});


QUnit.module('Attributes');

QUnit.test('definition', 3, function(assert){

    var comp = fwc();

    assert.ok(typeof comp.attrs === 'function', "the component definition holds the method attrs");
    assert.equal(comp.attrs('id', 'selected'), comp, "The method chains with arguments");
    assert.equal(comp.attrs(), ['id', 'selected'], "the method returns values without arguments");
});

        //it('should provide accessors definition', function(){
            //var comp = fwc();
            //expect(comp.access).to.be.a('function');
        //});
    //});

