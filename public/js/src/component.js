//attributes

//using Proxy or getter/setter

const comp = {
    get: function(target, name, receiver){
        console.log('get', target, name, receiver);
        console.log(target === receiver);
        return target[name];
    },

    set: function(target, name, value, receiver){
        console.log('set', target, name, value, receiver);
        target[name] = value;
    },

    has : function(target, name, receiver){
        console.log('has', arguments);
        return name in target;
    }
};

var myComp = new Proxy({}, comp);

comp.href= "test";
let a = comp.href;

//lifecycle

//events callbacks


//events


//var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    //unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    //prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

//exports.bind = function(el, type, fn, capture){
  //el[bind](prefix + type, fn, capture || false);
  //return fn;
//};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

//exports.unbind = function(el, type, fn, capture){
  //el[unbind](prefix + type, fn, capture || false);
  //return fn;
//};

var events = {

    on (name, delegates, handler) {
        this.addEventListener(name, handler, false);
    },

    off (name) {

    },

    trigger (name, data){

    }
};


