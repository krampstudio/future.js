var _              = require('lodash');
var eventDelegator = require('./events.js');


var fwc = function futureWebComponent(name, options){

    var data = {};

    var comp = {

        attributes(attrs){

            if(attrs === undefined){
                return data.attributes || {};
            }

            data.attributes = {};
            if(_.isArray(attrs)){
                attrs.forEach( (name) => {
                    data.attributes[name] = {
                        get() {
                            console.log('get ' + name);
                            return this.getAttribute(name);
                        },
                        set (val) {
                            console.log('set ' + name + ' to ' + val);
                            this.setAttribute(name, val);
                        }
                    };
                });
            }
            return this;
        },

        access(what, accessors){

            return this;
        },

        register(){

            //re trigger generic events
            comp.on('flow', (name, ...params) => comp.trigger.call(comp, name, params));
            comp.on('state', (name, ...params) => comp.trigger.call(comp, name, params));

            var eltProto = {
                createdCallback : {
                    value(...params){
                        console.log(this);
                        console.log("attr on create", this.attributes);

                        comp.trigger.call(comp, 'flow', 'create', params);

                        this.setAttribute('selected', 'item-2');
                    }
                },
                attachedCallback : {
                    value(...params){
                        comp.trigger.call(comp, 'flow', 'attach', params);
                    }
                },
                detachedCallback : {
                    value(...params){
                        comp.trigger.call(comp, 'flow', 'detach', params);
                    }
                },
                attributeChangedCallback : {
                    value(){
                        console.log('attr changes', arguments);
                        console.log("attrs on change", this.attributes);
                    }
                },
            };

            _.merge(eltProto, data.attributes);

            document.registerElement('f-' + name, {
                prototype : Object.create(HTMLElement.prototype, eltProto)
            });
        }
    };

    //
    eventDelegator(comp);

    return comp;
};

module.exports = fwc;
