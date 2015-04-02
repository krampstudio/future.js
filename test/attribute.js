/* global -expect */

var expect = require('chai').expect;
var fwc = require('../../src/fwc.js');
var fixture = require('../fixture.js');

describe('fwc attributes', function() {

    var container = fixture.createContainer();

    beforeEach(function() {
        fixture.load('test/fixtures/ftest.html');
    });

    afterEach(function() {
        fixture.clean();
    });

    it('should provides default accessors on attributes', function(done) {
        fwc('test')
            .on('error', function(e){
                console.error(e);
            })
            .on('create', function(){
                var ft = container.querySelector('f-test');
                expect(ft.nodeName).to.equal('F-TEST');
                expect(ft.foo).to.equal('true');
                expect(ft.bar).to.equal('pur');
                expect(ft.foo).to.equal(ft.getAttribute('foo'));
                expect(ft.bar).to.equal(ft.getAttribute('bar'));

                ft.foo = 'moo';
                expect(ft.foo).to.equal('moo');
                expect(ft.foo).to.equal(ft.getAttribute('foo'));

                done();
            })
            .attrs('foo', 'bar')
            .register();
    });
});
