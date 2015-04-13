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
                if(_.isString(name)){
                    data.attrs[name] = {
                        get() {
                            return this.getAttribute(name);
                        },
                        set (val) {
                            return this.setAttribute(name, val);
                        }
                    };
                }
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
                        return accessors.get.call(this, this.getAttribute(name));
                    }
                    return this.getAttribute(name);
                },
                set (val) {
                    if(_.isFunction(accessors.set)){
                        val = accessors.set.call(this, this.getAttribute(name), val);
                    }
                    return this.setAttribute(name, val);
                }
            };

            return this;
        },

        /**
         * Get/Set component content function
         *
         * @example fwc().content(function(data){
                    return `<div>${data.foo}</div>`;
            });
         *
         * @param {Function|String} [value] - called once created with the data.
         * @returns {fwComp|Object}
         */
        content(value){
            if(!value){
                return data.content;
            }
            if(typeof value === 'function'){
                data.content = value;
            } else {
                data.content = () => value;
            }
            return this;
        },

        register(){

            if(!_.isFunction(document.registerElement)){
                return this.trigger('error', 'The webcomponent polyfill is required on this environment');
            }

            //re trigger generic events
            comp.on('flow',  (name, elt) => comp.trigger.call(comp, name, elt));
            comp.on('state', (name, ...params) => comp.trigger.call(comp, name, params));


            var eltProto = {
                createdCallback : {
                    value(){

                        if(typeof data.content === 'function'){
                            let attrs = {};
                            for(let attr of comp.attrs()){
                                attrs[attr] = this[attr];   //so the getter is called
                            }
                            this.innerHTML = data.content(attrs);
                        }

                        comp.trigger.call(comp, 'flow', 'create', this);
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

            try {
                document.registerElement('f-' + name, {
                    prototype : Object.create(HTMLElement.prototype, eltProto)
                });
            } catch(e){
                this.trigger('error', e);
            }
        }
    };

    eventDelegator(comp);

    return comp;
};

module.exports = fwc;
