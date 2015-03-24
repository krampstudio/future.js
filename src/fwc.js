var _              = require('lodash');
var eventDelegator = require('./events.js');


var fwc = function futureWebComponentFactory(name, options){

    var data = {
        attrs : {},
    };

    /**
     * @typedef fwComp
     */
    var comp = {


        /**
         * Define the attributes of the component.
         *
         * @example fwc().attr('id', 'selected');
         * @example var attrs = fwc().attr();
         *
         * @param {Array} [attr] - the list of attributes in setter mode
         * @returns {fwComp|Array}
         */
        attrs(...attr){

            //getter
            if(!attr || attr.length === 0){
                return Object.keys(data.attrs);
            }

            //setter
            data.attrs = {};

            //each attribute get his own getter setter
            attr.forEach( name => {
                data.attrs[name] = {
                    get() {
                        return this.getAttribute(name);
                    },
                    set (val) {
                        this.setAttribute(name, val);
                    }
                };
            });

            return this;
        },

        /**
         * Get/Set attribute accessors.
         *
         * @example fwc().access('foo', {
                        get(){ return false; },
                        set(val){ return ++val; }
                    });
         *
         * @param {String} name - the attribute name
         * @param {Object} [accessors] - the attribute accessor in setter mode
         * @param {Function} [accessors.get] - getter, should return someting
         * @param {Function} [accessors.set] - setter get val in param and return something
         * @returns {fwComp|Object}
         */
        access(name, accessors){

            //getter
            if(!accessors){
                return data.attrs[name];
            }

            //setter, attribute's accessor is overriden
            data.attrs[name] = {
                get() {
                    if(_.isFunction(accessors.get)){
                        return accessors.get.call(this);
                    }
                    return this.getAttribute(name);
                },
                set (val) {
                    if(_.isFunction(accessors.set)){
                        val = accessors.set.call(this, val);
                    }
                    return this.setAttribute(name, val);
                }
            };

            return this;
        },

        content(value){
           //console.log(require('./menu/menu.tpl')());
           return this;
        },

        register(){

            if(!_.isFunction(document.registerElement)){
                return this.trigger('error', 'The webcomponent polyfill is required on this environment');
            }

            //re trigger generic events
            comp.on('flow',  (name, ...params) => comp.trigger.call(comp, name, params));
            comp.on('state', (name, ...params) => comp.trigger.call(comp, name, params));

            var eltProto = {
                createdCallback : {
                    value(...params){
                        //console.log(this);
                        //console.log("attr on create", this.attributes);

                        comp.trigger.call(comp, 'flow', 'create', params);

                        //this.setAttribute('selected', 'item-2');
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

            _.merge(eltProto, data.attrs);


            document.registerElement('f-' + name, {
                prototype : Object.create(HTMLElement.prototype, eltProto)
            });
        }
    };

    eventDelegator(comp);

    return comp;
};

module.exports = fwc;
