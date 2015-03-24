/* global -expect */

var expect = require('chai').expect;
var fwc = require('../src/fwc.js');

var container;
container = document.createElement('div');
document.body.appendChild(container);

function loadFixture(name){
    if(window.__html__[name]){
        container.innerHTML = window.__html__[name];
    }
}

describe('fwc', function() {

    afterEach(function() {
        container.innerHTML = '';
    });

    it('should be a function', function() {
        expect(fwc).to.be.a('function');
    });

    it('should be factory', function() {
        expect(fwc()).to.be.an('object');
    });

    describe('comp', function() {

        it('should be an event emitter', function(done) {
            var comp = fwc();
            expect(comp.on).to.be.a('function');
            expect(comp.once).to.be.a('function');
            expect(comp.trigger).to.be.a('function');
            expect(comp.emit).to.be.a('function');
            expect(comp.off).to.be.a('function');

            comp.on('error', function(e) {
                expect(e).to.be.instanceof(Error);
                expect(e.message).to.equal('test error');
                done();
            });
            comp.emit('error', new Error('test error'));
        });

        it('should provide attributes definition', function(){
            var comp = fwc();
            expect(comp.attrs).to.be.a('function');

            expect(comp.attrs('id', 'selected')).to.equal(comp);
            expect(comp.attrs()).to.deep.equal(['id', 'selected']);
        });

        it('should provide accessors definition', function(){
            var comp = fwc();
            expect(comp.access).to.be.a('function');
        });
    });

    describe('integration', function() {
        beforeEach(function() {
            loadFixture('test/fwc.html');
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
});
