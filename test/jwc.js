var expect = require('chai').expect;
var fwc    = require('../public/js/src/component/fwc.js');


describe('fwc', function(){

    it('should be a function', function(){
        expect(fwc).to.be.a('function');
    });

    it('should be factory', function(){
        expect(fwc()).to.be.an('object');
    });

    describe('comp', function(){

        it('should be an event emitter', function(done){
            var comp = fwc();
            expect(comp.on).to.be.a('function');
            expect(comp.once).to.be.a('function');
            expect(comp.trigger).to.be.a('function');
            expect(comp.emit).to.be.a('function');
            expect(comp.off).to.be.a('function');

            comp.on('error', function(e){
                expect(e).to.be.instanceof(Error);
                expect(e.message).to.equal('test error');
                done();
            });
            comp.emit('error', new Error('test error'));
        });


    });
});
