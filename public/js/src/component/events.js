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
var eventDelegator = function eventDelegator(target){
    var emitter = new EventEmitter();
    target = target || {};
    _.forEach(api, (method, alias) => {
        target[alias] = function delegate(){
            return emitter[method].apply(target, [].slice.call(arguments));
        };
    });
    return target;
};

module.exports = eventDelegator;
