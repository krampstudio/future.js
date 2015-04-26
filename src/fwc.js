var _              = require('lodash');
var eventDelegator = require('./events.js');

var fwc = function futureWebComponentFactory(name, options){


    var data = {
        attrs  : {},
        update : []
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

            if(def.update === true){
                data.update.push(name);
            }

            data.attrs[name] = {
                get() {
                    var value = this.getAttribute(name);
                    if(def.type){
                        let type = def.type.toLowerCase();
                        if(type === 'boolean'){
                            value = this.hasAttribute(name);
                        }
                        else if(type === 'integer'){
                            value = parseInt(value, 10);
                        }
                        else if(type === 'float'){
                            value = parseFloat(value);
                        }
                    }

                    //call user defined getter
                    if(_.isFunction(def.get)){
                        return def.get.call(this, value);
                    }

                    return value;
                },
                set (value) {
                    var type;
                    if(def.type){
                        type = def.type.toLowerCase();
                        if(type === 'boolean'){
                            value = !!value;
                        } else if(type === 'integer'){
                            value = parseInt(value, 10);
                        }
                        else if(type === 'float'){
                            value = parseFloat(value);
                        }
                    }

                    //call setter
                    if(_.isFunction(def.set)){
                        value = def.set.call(this, this.getAttribute(name), value);
                    }

                    if (type === 'boolean'){
                        if(value){
                            this.setAttribute(name, '');
                        } else {
                            this.removeAttribute(name);
                        }
                        return value;
                    }

                    return this.setAttribute(name, value);
                }
            };
            return this;
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
                        if(_.contains(data.update, name)){
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
