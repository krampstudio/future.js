var emitter =  require('events').EventEmitter;


var fwc = function futureWebComponent(name, options){

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

    return comp;
};

module.exports = fwc;
