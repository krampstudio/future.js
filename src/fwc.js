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
         * @param {String} [name]
         * @param {Object} [def]
         * @param {Function} [def.get]
         * @param {Function} [def.set]
         * @param {String} [def.type]
         * @param {Boolean} [def.update]
         */
        attr(name, def){

            if(_.isPlainObject(name) && _.isString(name.name)){
                def = _.clone(name);
                name = def.name;
            }

            //getter
            if(!def){
                return data.attrs[name];
            }

            data.attrs[name] = {
                update : def.update,
                get() {
                    var value = this.getAttribute(name);
                    if(def.type){
                        if(def.type.toLowerCase() === 'boolean'){
                            value = this.hasAttribute(name);
                        }
                        else if(def.type.toLowerCase() === 'integer'){
                            value = parseInt(value, 10);
                        }
                        else if(def.type.toLowerCase() === 'float'){
                            value = parseFloat(value);
                        }
                    }

                    if(_.isFunction(def.get)){
                        return def.get.call(this, value);
                    }
                    return value;
                },
                set (val) {
                    if(def.type){
                        if(def.type.toLowerCase() === 'boolean'){
                            val = !!val;
                        }
                        else if(def.type.toLowerCase() === 'integer'){
                            val = parseInt(val, 10);
                        }
                        else if(def.type.toLowerCase() === 'float'){
                            val = parseFloat(val);
                        }
                    }
                    if(_.isFunction(def.set)){
                        val = def.set.call(this, this.getAttribute(name), val);
                    }
                    if (def.type && def.type.toLowerCase() === 'boolean'){
                        if(val){
                            return this.setAttribute(name, '');
                        } else {
                            return this.removeAttribute(name);
                        }
                    }
                    return this.setAttribute(name, val);
                }
            };
        },

        /**
         * Define the attributes of the component.
         *
         * @example fwc().attr('id', 'selected');
         * @example var attrs = fwc().attr();
         *
         * @param {Array} [attributes] - the list of attributes in setter mode
         * @returns {fwComp|Array}
         */
        attrs(...attributes){
            var self = this;

            //getter
            if(!attributes || attributes.length === 0){
                return Object.keys(data.attrs);
            }

            //setter
            data.attrs = {};

            //each attribute get his own getter setter
            attributes.forEach( (attr) => {
                if(_.isString(attr)){
                    attr = { name : attr };
                }
                if (_.isPlainObject(attr) && _.isString(attr.name)){
                    this.attr(attr.name, attr);
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
            this.attr(name, {
                get : accessors.get,
                set : accessors.set
            });

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

            var renderContent = function renderContent(elt){
                if(typeof data.content === 'function'){
                    let attrs = {};
                    for(let attr of comp.attrs()){
                        attrs[attr] = elt[attr];   //so the getter is called
                    }
                    elt.innerHTML = data.content(attrs);
                }
            };

            var eltProto = {
                createdCallback : {
                    value(){

                        renderContent(this);

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
                    value(name, old, val){
                        if(data.attrs[name] && data.attrs[name].update === true){
                            renderContent(this);
                        }
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
