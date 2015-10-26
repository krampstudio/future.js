/**
* Future.js - 2015
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 */

/**
 * FWC stands for Future.js Web Component.
 * It's a wrapper to help you create web components the Future.js way.
 * @module fwc
 */

import eventify from './eventify.js';
import htmlElements from './fwc/elements.json';
import { caster as attrCaster } from './fwc/attr.js';

//The registry keeps a ref to previously registered
//components in order to extend them.
let registry = new Map();


/**
 * Where everything starts, this function will gives you a reference to an component model.
 * @param {String} name - the component name with or without the namespace that matches the HTMLElement naming rules.
 * @param {Object} [options] - additional configuration options
 * @param {String} [options.namespace = 'f'] - set the component namespace manually
 * @returns  {fwComponent} the component model
 */
const fwc = function futureWebComponentFactory(name = '', { namespace = 'f', autoRegister = true} = {}){

    const data = {
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
        name = name.replace(new RegExp('^' + namespace + '-', 'i'), '');
    }

    //validate namesapce
    if(!/^[a-zA-Z]+$/.test(namespace)){
        throw new TypeError(`The namespace ${namespace} can contain only letters`);
    }


    /**
     * Lookup for custom element to register in the content.
     * The lookup is restricted to to same namespace
     * @param {HTMLElement} elt - the main element instance
     * @param {DocumentFragment|HTMLElement} content - the content to lookup inside
     * @fires fwc#flow all flow events from the sub element, namspaced
     */
    const lookupAutoResgister = function lookupAutoResgister(elt, content){
        let pattern = new RegExp('^' + namespace + '-', 'i');
        Array.from(content.querySelectorAll('*'))
            .filter( contentElt => contentElt.tagName.match(pattern) && !registry.has(contentElt.tagName.toLowerCase()))
            .forEach( contentElt => {
                let contentEltName = contentElt.tagName.toLowerCase().replace(namespace + '-', '');
                fwc(contentEltName, { namespace })
                .on('flow', (event, eventElt, ...params) => self.trigger('flow', `${event}.${contentEltName}`, eventElt, elt, ...params))
                .register();
            });
    };

    /**
     * Helps you to create a component definition.
     * @typedef fwComponent
     */
    let comp = {

        /**
         * Define the bahavior for a component attribute.
         * Can be also called as a getter without the definition.
         *
         * @example fwc().attr('id', { });
         * @example var attrs = fwc().attr('id');
         *
         * @param {String} name - the attribute name
         * @param {Object} [def] - the attribute behavior definition
         * @param {attrGetter} [def.get] - add a getter to the attribute
         * @param {attrSetter} [def.set] - add a setter to the attribute
         * @param {String} [def.type] - cast the attribute value when accesse, in 'integer', 'float' and 'boolean'
         * @param {Boolean} [def.update] - if true changing this attribute trigger an rerendering of the content
         * @returns {Object|fwComponent} chains in setter mode, returns the attr definition in getter mode.
         */
        attr(name, def){

            //forbidden attributes
            const forbidden = ['id', 'class', 'is'];

            if(typeof name === 'object' && typeof name.name === 'string'){
                let temp = name;
                def = name;
                name = temp.name;
            }

            //returns the definitino
            if(!def){
                return data.attrs[name];
            }

            if(forbidden.indexOf(name) > -1){
                throw new TypeError(`You can't modify the behavior of the attribute ${name}`);
            }

            //maintain a list of attributes that trigger rerender on change
            if(def.update === true){
                data.update.push(name);
            }

            if(def.type){
                def.type = def.type.toLowerCase();
            }

            //create the attr definition, formated for Object.defineProperty
            data.attrs[name] = {
                get() {
                    let value;

                    //call type caster
                    if(def.type && attrCaster[def.type]){
                        value = attrCaster[def.type].get.call(this, name);
                    } else {
                        value = this.getAttribute(name);
                    }

                    //call user defined getter
                    if(typeof def.get === 'function'){

                        /**
                         * @callback attrGetter
                         * @param {String} nodeValue - the value in the DOM
                         * @returns {*} the upgraded value
                         */
                        return def.get.call(this, value);
                    }

                    return value;
                },
                set (value) {

                    //call type caster
                    if(def.type && attrCaster[def.type]){
                        value = attrCaster[def.type].set.call(this, value);
                    }

                    //call setter
                    if(typeof def.set === 'function'){

                        /**
                         * @callback attrSetter
                         * @param {String} nodeValue - the value in the DOM
                         * @param {*} value - the value to set
                         * @returns {*} the upgraded value
                         */
                        value = def.set.call(this, this.getAttribute(name), value);
                    }

                    if (def.type === 'boolean'){
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

            //getter
            if(!attributes || attributes.length === 0){
                return Object.keys(data.attrs);
            }

            //setter
            data.attrs = {};

            //each attribute get his own getter setter
            attributes.forEach( attr => {
                if(typeof attr === 'string'){
                    attr = { name : attr };
                }
                if (typeof attr === 'object' && typeof attr.name === 'string'){
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
         * Get/Set a method to your component.
         *
         * @example fwc().method('foo', () => 'bar');
         *
         * @param {String} name - the method name
         * @param {Function} [value] - the function to be executed
         * @returns {fwComp|Function}
         */
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
         * @param {Function|HTMLElemen|String} [value] - called once created with the data.
         * @returns {fwComp|Object}
         */
        content(value){
            if(!value){
                return data.content;
            }

            //from a node (like a <template> tag)
            if(value instanceof HTMLElement){
                data.content = attr => {
                    if(value.content){
                        //quick data binding key is node class
                        let clone = document.importNode(value.content, true);
                        for(let key in attr){
                            let node = clone.querySelector('.' + key);
                            if(node){
                                node.textContent = attr[key];
                            }
                        }
                        return clone;
                    }
                    return value.innerHtml;
                };

            //a function, can be any template engine
            } else if(typeof value === 'function'){
                data.content = value;

            //just the content
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

        /**
         * Register the component into the current document
         * @returns {fwComp}
         * @throws Error if the current runtime doesn't support custom elements
         */
        register(){
            let self = this;
            if(!document.registerElement || typeof document.registerElement !== 'function'){
                throw new Error('The webcomponent polyfill is required on this environment');
            }

            //re trigger generic events
            this.on('flow',  (name, elt, ...params) => this.trigger(name, elt, ...params));
            this.on('state', (name, ...params) => this.trigger.call(this, name, ...params));


            /**
             * Render the content of the element
             * @param {HTMLElement} elt - the component instance
             * @fires fwc#rendering when content is being rendered
             * @fires fwc#rendered once content is rendered
             */
            const renderContent = function renderContent(elt){
                if(typeof data.content === 'function'){
                    let attrs = {};
                    for(let attr of comp.attrs()){
                        attrs[attr] = elt[attr];   //so the getter is called
                    }

                    self.trigger('rendering', elt);

                    let rendered = data.content(attrs);
                    if(typeof rendered === 'string'){
                        rendered = document.createRange().createContextualFragment(rendered);
                    }

                    if(rendered instanceof DocumentFragment || rendered instanceof HTMLElement){

                        if(autoRegister && !data.autoRegisterDone){
                            lookupAutoResgister(elt, rendered);
                            data.autoRegisterDone = true;
                        }

                        elt.innerHTML = '';
                        elt.appendChild(rendered);
                    }

                    self.trigger('rendered', elt);
                }
            };


            /**
             * If some events are recognized as native,
             * then a listener will delegates those events to the definition.
             *
             * @param {HTMLElement} elt - the component instance
             */
            var delegateNativeEvents = function delegateNativeEvents(elt){
                for(let eventType of Object.keys(self.events())){
                    if(typeof elt['on' + eventType.toLowerCase()] !== 'undefined'){
                        self.events(eventType).forEach( () => {
                            elt.addEventListener(eventType, (...params) => {
                                self.trigger(eventType, elt, ...params);
                            });
                        });
                    }
                }
            };


            //The prototype that is going to be regsitered
            //first we attach lifecycle callback with a predefined behavior
            var eltProto = {

                createdCallback : {
                    value(){

                        self.trigger('flow', 'creating', this);

                        //render the content
                        renderContent(this);

                        //add HTML events listeners
                        delegateNativeEvents(this);

                        self.trigger('flow', 'create', this);
                    }
                },

                attachedCallback : {
                    value(...params){
                        self.trigger('flow', 'attach', this, ...params);
                    }
                },

                detachedCallback : {
                    value(...params){
                        self.trigger('flow', 'detach', this, ...params);
                    }
                },

                attributeChangedCallback : {
                    value(name/*, old, val*/){

                        //some attributes changes triggers a re render
                        if(data.update.indexOf(name) > -1){
                            renderContent(this);
                        }
                    }
                }
            };

            //attach the attributes and methods definitions
            Object.assign(eltProto, data.attrs, data.methods);

            try {

                //the full element name
                let elementName = `${namespace}-${name}`;

                //extends a base proto
                let newProto = Object.create(data.baseProto, eltProto);

                //register the element
                document.registerElement(elementName, {
                    prototype:  newProto,
                    extends:    data.extendTag
                });

                //keep a copy of the new proto for future extends
                registry.set(elementName, newProto);

            } catch(e){
                this.trigger('error', e);
            }

            return this;
        }
    };

    //make fwc a event emiter before returning it.
    return eventify(comp);
};

/**
 * Validate if a name can be given to an custom element.
 * The rule is a tag name with a dash.
 * @param {String} name - the name to validate
 * @returns {Boolean} true if valid
 */
function validateEltName(name){
    return /^([a-z]+-)?[a-z]+[a-z0-9]*$/i.test(name);
}

export default fwc;
