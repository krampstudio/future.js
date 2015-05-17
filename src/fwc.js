var _              = require('lodash');
var eventDelegator = require('./events.js');

var registry = new Map();


var fwc = function futureWebComponentFactory(name = '', options = {}){

    var namespace;

    var data = {
        baseProto: HTMLElement.prototype,
        attrs:     {},
        methods:   {},
        update:    []
    };

    if(!validateEltName(name)){
        throw new TypeError(`The component name '${name}' does not match the HTMLElement naming rules`);
    }

    /**
     * The component namespace (what's before the dash in the tag)
     */
    let matchNs = name.match(/^[a-z]+(?=-)/i);
    if(matchNs && matchNs.length){
        namespace = matchNs[0];
    } else {
        namespace = options.namespace || 'f';
    }

    //validate namesapce
    if(!/^[a-zA-Z]+$/.test(namespace)){
        throw new TypeError(`The namespace ${namespace} can contain only letters`);
    }

    /**
     * @typedef fwComp
     */
    let comp = {

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

        method(name, value){
            if(name && !value){
                return data.methods[name];
            }

            data.methods[name] = {
                value(...params){
                    return value.call(this, ...params);
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

        /**
         * Extend an HTML Element or another component.
         *
         * Status : Experimental.
         *
         * You can extend most of the HTMLElements and benefit it's prototype.
         * Then your component's tag should use the `is` syntax.
         * The list of tags/prototype is maintained in {@link ./elements.json}.
         * @example fwc('load').extend('a').register();
         *          <a is="f-load" href="#">link</a>
         *
         * You can also extend another component that has been already registered.
         * You'll also benefit it's prototype, but the syntax remains the common one.
         * @example fwc('load').extend('f-foo').register();
         *          <f-load href="#">link</f-load>
         *
         * @param {String} element - the element name / tag name
         * @returns {fwComp|HTMLElementPrototype} chains or get the base prototype
         */
        extend(element){
            var elementName,
                protoName;

            if(typeof element === 'undefined'){
                return data.baseProto;
            }

            if(!validateEltName(element)){
                throw new TypeError(`${element} is not a valid HTMLElement name`);
            }

            //1st check in our custom elements
            if(registry.has(element)){
                elementName = element;
            } else if(registry.has(`${namespace}-${element}`)){
                elementName = `${namespace}-${element}`;
            }
            if(elementName){
                data.baseProto = registry.get(elementName);
            } else {

                //look at the list of supported elements for the prototype name
                let htmlElements = require('./elements.json');
                for(let eltName of Object.keys(htmlElements)){
                    if(htmlElements[eltName].nodes.indexOf(element) > -1){
                        protoName = eltName;
                        break;
                    }
                }

                //set the HTMLElement prototype as a base and the tag name
                if(protoName && typeof window[protoName] !== 'undefined'){
                    data.baseProto = window[protoName].prototype;
                    data.extendTag = element;
                }
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

            _.merge(eltProto, data.attrs, data.methods);

            try {
                let elementName = `${namespace}-${name}`;
                let newProto = Object.create(data.baseProto, eltProto);
                document.registerElement(elementName, {
                    prototype:  newProto,
                    extends:    data.extendTag
                });

                registry.set(elementName, newProto);
            } catch(e){
                this.trigger('error', e);
            }
        }
    };



    eventDelegator(comp);

    return comp;
};

function validateEltName(name){
    return /^([a-z]+-)?[a-z]+[a-z0-9]*$/i.test(name);
}

module.exports = fwc;
