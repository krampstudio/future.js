/**
 * Helps you to make an object an event emitter
 */
var _            = require('lodash');
var EventEmitter = require('events').EventEmitter;

//alias event emitter functions
var aliases = {
    trigger: 'emit',
    off: 'removeListener'
};

//list of methods to add to the target
var api = _(EventEmitter.prototype)
    .functions()
    .reduce((acc, name) => {
        acc[name] = name;
        return acc;
    }, aliases);

/**
 * Makes the target an event emitter by delegating the api to an event emitter
 * @param {Object} target - the target object
 * @returns {Object} the target augmented of the event api
 */
var eventDelegator = function eventDelegator(target = {}, delegateNative = false){
    var emitter = new EventEmitter();
    _.forEach(api, (method, alias) => {
        target[alias] = function delegate(...args){
            if(delegateNative && args.length > 1 && args[1] instanceof HTMLElement){
                console.log('Delegate to native ', alias, args[0], args[1]);
            }
            return emitter[method].apply(target, args);
        };
    });
    return target;
};

module.exports = eventDelegator;
