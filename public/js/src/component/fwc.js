var EventEmitter =  require('events').EventEmitter;
var _ = require('lodash');

//evenApi is
var eventApi =
    _(new EventEmitter())
        .functions()
        .reduce( (acc, name) => {
            acc[name] = name;
            return acc;
        }, {
            trigger : 'emit',
            off : 'removeListener'
        });

var fwc = function futureWebComponent(name, options){

    var emitter = new EventEmitter();

    var comp = {

        attributes(attrs){

            return this;
        },

        access(what, accessors){
            return this;
        },

        register(){
            document.registerElement('f-menu', {
                prototype : Object.create(HTMLElement.prototype, this._eltProto)
            });
        }
    };

    _.forEach(eventApi, (method, alias) => {
        comp[alias] = function delegate (){
            return emitter[method].apply(comp, [].slice.call(arguments));
        };
    });

    return comp;
};

module.exports = fwc;
