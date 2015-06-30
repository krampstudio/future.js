var router = require('router');

QUnit.module('API');

QUnit.test("module", 2, function(assert){
    assert.ok(typeof router !== 'undefined', "The module exports something");
    assert.ok(typeof router === 'function',  "The module exports a function");
});


QUnit.test("factory", 6, function(assert){

    let routing = router();

    assert.ok(typeof routing === 'object',            "the router definition is an object");
    assert.ok(typeof routing.add === 'function',      "the router has got the method register");
    assert.ok(typeof routing.register === 'function', "the router has got the method register");
    assert.ok(typeof routing.load === 'function',     "the router has got the method register");
    assert.ok(typeof routing.resolve === 'function',  "the router has got the method register");
    assert.notDeepEqual(routing, router(),            "the router is a factory and creates an new router instance");
});

QUnit.test("is an event emitter", 5, function(assert){

    let routing = router();

    assert.ok(typeof routing === 'object',           "the router is an object");
    assert.ok(typeof routing.on === 'function',      "the router has got method on");
    assert.ok(typeof routing.trigger === 'function', "the router has got the method trigger");
    assert.ok(typeof routing.off === 'function',     "the router has got the method off");
    assert.ok(typeof routing.events === 'function',  "the router has got the method events");
});


QUnit.module('routes');

QUnit.test("config", 4, function(assert){

    assert.throws( () => router([{}]),               TypeError, "Empty route");
    assert.throws( () => router([{'foo' : 'bar'}]),  TypeError, "Wrong route");
    assert.throws( () => router([{'url' : '/foo'}]), TypeError, "Missing action");

    let routing = router([{
        'url' : '/foo',
        'register' : './comp.js'
    }]);

    assert.ok(typeof routing === 'object', "the router is an object");
});

QUnit.test("resolve", 3, function(assert){

    var loaded = false;
    let load   = function (){ loaded = true; };


    let routing = router([{
        url : '/foo',
        load
    }]);

    assert.ok(typeof routing === 'object', "the router is an object");
    assert.equal(loaded, false, 'the route is not resolved');

    routing.resolve('/foo');

    assert.equal(loaded, true, 'the route is now resolved');
});

