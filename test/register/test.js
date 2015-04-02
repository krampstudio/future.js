var fwc = require('../../src/fwc.js');

QUnit.module('Module');

QUnit.test('factory', function(assert) {
    assert.ok(typeof fwc === 'function', "The module expose a function");
    assert.ok(typeof fwc() === 'object', "The module creates an object");
});

/*
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
});
*/

