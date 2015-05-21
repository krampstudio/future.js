/**
 * Helps you to make an object an event emitter
 */
var EventEmitter = require('events').EventEmitter;

//alias event emitter functions
var aliases = {
    trigger: 'emit',
    off: 'removeListener'
};

var natives = {
    addListener(eventName, elt, handler){
        return elt.addEventListener(eventName, handler, false);
    },
    emit(eventName, elt){
        if (typeof window.Event === 'function') {
            return elt.dispatchEvent(new Event(eventName, {
                cancelable : true,
                bubbles : true
            }));
        } else {
            let event = document.createEvent("HTMLEvents");
            event.initEvent(eventName, true, true);
            return elt.dispatchEvent(event);
        }
    },
    removeListener(eventName, elt){
        this.listeners().forEach( listener => {
            elt.removeEventListener(eventName, listener);
        });
    }
};

//list of methods to add to the target
var api = Object.keys(EventEmitter.prototype)
    .filter( name => typeof EventEmitter.prototype[name] === 'function')
    .reduce((acc, name) => {
        acc[name] = name;
        return acc;
    }, aliases);


var events = {
    /**
     * Makes the target an event emitter by delegating the api to an event emitter
     * @param {Object} target - the target object
     * @returns {Object} the target augmented of the event api
     */
    eventify(target = {}, delegateNative = false){
        var emitter = new EventEmitter();
        Object.keys(api).forEach( alias => {
            let method = api[alias];
            if(!target[alias]){
                target[alias] = function delegate(...args){
                    if(delegateNative && args.length > 1 && args[1] instanceof HTMLElement){
                        let [eventName, elt, ...rest] = args;
                        //console.log('Delegate to native ');
                        //console.log('method',  method);
                        //console.log('alias', alias);
                        //console.log('event', eventName);
                        //console.log('element', elt);
                        //console.log('rest', rest);

                        if(typeof natives[method] === 'function'){
                            natives[method].call(target, eventName, elt, ...rest);
                        }
                    }
                    return emitter[method].apply(target, args);
                };
            }
        });
        return target;
    }
};
module.exports = events;
