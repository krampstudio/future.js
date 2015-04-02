/* global -expect */

var expect = require('chai').expect;
var fwc = require('../../src/fwc.js');
var fixture = require('../fixture.js');

describe('fwc register', function() {

    var container = fixture.createContainer();

    beforeEach(function() {
        fixture.load('test/fixtures/ftest.html');
    });

    afterEach(function() {
        fixture.clean();
    });

    it('should register a component', function(done) {
        fwc('test')
            .on('error', function(e){
                console.error(e);
            })
            .on('create', function(){
                var ft = container.querySelector('f-test');
                expect(ft.nodeName).to.equal('F-TEST');
                done();
            })
            .register();
    });
});
