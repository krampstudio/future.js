import '../sauce.js';
import QUnit from 'qunitjs';
import router from 'router';

QUnit.module('API');

QUnit.test("module", 2, function(assert){
    assert.ok(typeof router !== 'undefined', "The module exports something");
    assert.ok(typeof router === 'function',  "The module exports a function");
});


QUnit.test("factory", 4, function(assert){

    let routing = router();

    assert.ok(typeof routing === 'object',            "the router definition is an object");
    assert.ok(typeof routing.add === 'function',      "the router has got the method add");
    assert.ok(typeof routing.resolve === 'function',  "the router has got the method resolve");
    assert.notDeepEqual(routing, router(),            "the router is a factory and creates an new router instance");
});


QUnit.module('routes');

QUnit.test("config", 6, function(assert){

    assert.throws( () => router([{}]),               TypeError, "Empty route");
    assert.throws( () => router([{'foo' : 'bar'}]),  TypeError, "Wrong route");
    assert.throws( () => router([{'url' : '/foo'}]), TypeError, "Missing handlers");
    assert.throws( () => router([{'url' : '/foo', 'handlers' : true }]), TypeError, "Wrong handlers");
    assert.throws( () => router([{'url' : '/foo', 'handlers' : [] }]), TypeError, "No handlers");

    let routing = router([{
        'url' : '/foo',
        'handlers' : () => {}
    }]);

    assert.ok(typeof routing === 'object', "the router is an object");
});

QUnit.test("resolve one", 3, function(assert){

    var loaded = false;
    let handlers   = () => loaded = true;


    let routing = router([{
        url : '/foo',
        handlers
    }]);

    assert.ok(typeof routing === 'object', "the router is an object");
    assert.equal(loaded, false, 'the route is not resolved');

    routing.resolve('/foo');

    assert.equal(loaded, true, 'the route is now resolved');
});


QUnit.test("resolve a stack with patterns", 11, function(assert){

    var route = false;
    let route1   = () => route = 1;
    let route2   = () => route = 2;
    let route3   = () => route = 3;

    let routing = router([{
        url : '/foo',
        handlers : route1
    }, {
        url : '/bar/*',
        handlers : route2
    }, {
        url : '/baz/:id/baz',
        handlers : route3
    }]);

    assert.ok(typeof routing === 'object', "the router is an object");
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

QUnit.test("resolve once", 5, function(assert){

    var loaded = 0;
    let handlers   = () => loaded++;

    let routing = router([{
        url : '/foo',
        handlers,
        once : true
    }]);

    assert.ok(typeof routing === 'object', "the router is an object");
    assert.equal(loaded, 0, 'the route is not resolved');

    routing.resolve('/moo');
    assert.equal(loaded, 0, 'the route is not yet resolved');

    routing.resolve('/foo');
    assert.equal(loaded, 1, 'the route is resolved');

    routing.resolve('/foo');
    assert.equal(loaded, 1, 'the route is not resloved again');
});

