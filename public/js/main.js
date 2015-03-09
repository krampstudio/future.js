(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/bertrand/dev/projects/future.js/public/js/src/component.js":[function(require,module,exports){
"use strict";

//attributes

//using Proxy or getter/setter

var comp = {
    get: function get(target, name, receiver) {
        console.log("get", target, name, receiver);
        console.log(target === receiver);
        return target[name];
    },

    set: function set(target, name, value, receiver) {
        console.log("set", target, name, value, receiver);
        target[name] = value;
    },

    has: function has(target, name, receiver) {
        console.log("has", arguments);
        return name in target;
    }
};

var myComp = new Proxy({}, comp);

comp.href = "test";
var a = comp.href;

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

    on: function on(name, delegates, handler) {
        this.addEventListener(name, handler, false);
    },

    off: function off(name) {},

    trigger: function trigger(name, data) {}
};

},{}],"/home/bertrand/dev/projects/future.js/public/js/src/main.js":[function(require,module,exports){
"use strict";

},{}],"/home/bertrand/dev/projects/future.js/public/js/src/sample.js":[function(require,module,exports){
"use strict";

//simple

//var XFoo = document.registerElement('x-foo');
//document.body.appendChild(new XFoo);
//<x-foo></x-foo>
//var xFoo = document.createElement('x-foo');

//extends

//var XButton = document.registerElement('x-button', {
//prototype: Object.create(HTMLButtonElement.prototype),
//extends: 'button'
//});
//var b = new XButton;
//b.textContent = 'click me';
//document.body.appendChild(b);
//<x-button is="button"></x-button>
//var xButton = document.createElement('button', 'x-button');

// methods and properties

//var XBar = document.registerElement('x-bar', {
//prototype: Object.create(HTMLElement.prototype, {
//bar: {
//get: function() { return 5; }
//},
//foo: {
//value: function() {
//console.log('foo() called');
//}
//}
//})
//});
//var xbar = document.createElement('x-bar');
//console.log('getter', xbar.bar);
//xbar.foo();

//lifecycle on protitype

//createdCallback 	an instance of the element is created
//attachedCallback 	an instance was inserted into the document
//detachedCallback 	an instance was removed from the document
//attributeChangedCallback(attrName, oldVal, newVal) 	an attribute was added, removed, or updated

//var XFooProto = Object.create(HTMLElement.prototype);

//XFooProto.createdCallback = function() {
//this.innerHTML = "<b>I'm an x-foo-with-markup!</b>";
//};

//var XFoo = document.registerElement('x-foo-with-markup', {prototype: XFooProto});

//shadow DOM
//var XFooProto = Object.create(HTMLElement.prototype);

//XFooProto.createdCallback = function() {
//// 1. Attach a shadow root on the element.
//var shadow = this.createShadowRoot();

//// 2. Fill it with markup goodness.
//shadow.innerHTML = "<b>I'm in the element's Shadow DOM!</b>";
//};

//var XFoo = document.registerElement('x-foo-shadowdom', {prototype: XFooProto});

//template, shadow dom and scoped style

//<template id="sdtemplate">
//<style>
//p { color: orange; }
//</style>
//<p>I'm in Shadow DOM. My markup was stamped from a &lt;template&gt;.</p>
//</template>

//<script>
//var proto = Object.create(HTMLElement.prototype, {
//createdCallback: {
//value: function() {
//var t = document.querySelector('#sdtemplate');
//var clone = document.importNode(t.content, true);
//this.createShadowRoot().appendChild(clone);
//}
//}
//});
//document.registerElement('x-foo-from-template', {prototype: proto});
//</script>

},{}]},{},["/home/bertrand/dev/projects/future.js/public/js/src/component.js","/home/bertrand/dev/projects/future.js/public/js/src/main.js","/home/bertrand/dev/projects/future.js/public/js/src/sample.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9iZXJ0cmFuZC9kZXYvcHJvamVjdHMvZnV0dXJlLmpzL3B1YmxpYy9qcy9zcmMvY29tcG9uZW50LmpzIiwicHVibGljL2pzL3NyYy9tYWluLmpzIiwicHVibGljL2pzL3NyYy9zYW1wbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNJQSxJQUFNLElBQUksR0FBRztBQUNULE9BQUcsRUFBRSxhQUFTLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ2pDLGVBQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDM0MsZUFBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUM7QUFDakMsZUFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkI7O0FBRUQsT0FBRyxFQUFFLGFBQVMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFDO0FBQ3hDLGVBQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ2xELGNBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7S0FDeEI7O0FBRUQsT0FBRyxFQUFHLGFBQVMsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbEMsZUFBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDOUIsZUFBTyxJQUFJLElBQUksTUFBTSxDQUFDO0tBQ3pCO0NBQ0osQ0FBQzs7QUFFRixJQUFJLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRWpDLElBQUksQ0FBQyxJQUFJLEdBQUUsTUFBTSxDQUFDO0FBQ2xCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOENsQixJQUFJLE1BQU0sR0FBRzs7QUFFVCxNQUFFLEVBQUMsWUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRTtBQUMxQixZQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMvQzs7QUFFRCxPQUFHLEVBQUMsYUFBQyxJQUFJLEVBQUUsRUFFVjs7QUFFRCxXQUFPLEVBQUMsaUJBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxFQUVuQjtDQUNKLENBQUM7OztBQ3BGRjtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy9hdHRyaWJ1dGVzXG5cbi8vdXNpbmcgUHJveHkgb3IgZ2V0dGVyL3NldHRlclxuXG5jb25zdCBjb21wID0ge1xuICAgIGdldDogZnVuY3Rpb24odGFyZ2V0LCBuYW1lLCByZWNlaXZlcil7XG4gICAgICAgIGNvbnNvbGUubG9nKCdnZXQnLCB0YXJnZXQsIG5hbWUsIHJlY2VpdmVyKTtcbiAgICAgICAgY29uc29sZS5sb2codGFyZ2V0ID09PSByZWNlaXZlcik7XG4gICAgICAgIHJldHVybiB0YXJnZXRbbmFtZV07XG4gICAgfSxcblxuICAgIHNldDogZnVuY3Rpb24odGFyZ2V0LCBuYW1lLCB2YWx1ZSwgcmVjZWl2ZXIpe1xuICAgICAgICBjb25zb2xlLmxvZygnc2V0JywgdGFyZ2V0LCBuYW1lLCB2YWx1ZSwgcmVjZWl2ZXIpO1xuICAgICAgICB0YXJnZXRbbmFtZV0gPSB2YWx1ZTtcbiAgICB9LFxuXG4gICAgaGFzIDogZnVuY3Rpb24odGFyZ2V0LCBuYW1lLCByZWNlaXZlcil7XG4gICAgICAgIGNvbnNvbGUubG9nKCdoYXMnLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gbmFtZSBpbiB0YXJnZXQ7XG4gICAgfVxufTtcblxudmFyIG15Q29tcCA9IG5ldyBQcm94eSh7fSwgY29tcCk7XG5cbmNvbXAuaHJlZj0gXCJ0ZXN0XCI7XG5sZXQgYSA9IGNvbXAuaHJlZjtcblxuLy9saWZlY3ljbGVcblxuLy9ldmVudHMgY2FsbGJhY2tzXG5cblxuLy9ldmVudHNcblxuXG4vL3ZhciBiaW5kID0gd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgPyAnYWRkRXZlbnRMaXN0ZW5lcicgOiAnYXR0YWNoRXZlbnQnLFxuICAgIC8vdW5iaW5kID0gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgPyAncmVtb3ZlRXZlbnRMaXN0ZW5lcicgOiAnZGV0YWNoRXZlbnQnLFxuICAgIC8vcHJlZml4ID0gYmluZCAhPT0gJ2FkZEV2ZW50TGlzdGVuZXInID8gJ29uJyA6ICcnO1xuXG4vKipcbiAqIEJpbmQgYGVsYCBldmVudCBgdHlwZWAgdG8gYGZuYC5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gY2FwdHVyZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbi8vZXhwb3J0cy5iaW5kID0gZnVuY3Rpb24oZWwsIHR5cGUsIGZuLCBjYXB0dXJlKXtcbiAgLy9lbFtiaW5kXShwcmVmaXggKyB0eXBlLCBmbiwgY2FwdHVyZSB8fCBmYWxzZSk7XG4gIC8vcmV0dXJuIGZuO1xuLy99O1xuXG4vKipcbiAqIFVuYmluZCBgZWxgIGV2ZW50IGB0eXBlYCdzIGNhbGxiYWNrIGBmbmAuXG4gKlxuICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGNhcHR1cmVcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG4vL2V4cG9ydHMudW5iaW5kID0gZnVuY3Rpb24oZWwsIHR5cGUsIGZuLCBjYXB0dXJlKXtcbiAgLy9lbFt1bmJpbmRdKHByZWZpeCArIHR5cGUsIGZuLCBjYXB0dXJlIHx8IGZhbHNlKTtcbiAgLy9yZXR1cm4gZm47XG4vL307XG5cbnZhciBldmVudHMgPSB7XG5cbiAgICBvbiAobmFtZSwgZGVsZWdhdGVzLCBoYW5kbGVyKSB7XG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgfSxcblxuICAgIG9mZiAobmFtZSkge1xuXG4gICAgfSxcblxuICAgIHRyaWdnZXIgKG5hbWUsIGRhdGEpe1xuXG4gICAgfVxufTtcblxuXG4iLCJcInVzZSBzdHJpY3RcIjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklpSXNJbVpwYkdVaU9pSXZhRzl0WlM5aVpYSjBjbUZ1WkM5a1pYWXZjSEp2YW1WamRITXZablYwZFhKbExtcHpMM0IxWW14cFl5OXFjeTl6Y21NdmJXRnBiaTVxY3lJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYlhYMD0iLCJcInVzZSBzdHJpY3RcIjtcblxuLy9zaW1wbGVcblxuLy92YXIgWEZvbyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgneC1mb28nKTtcbi8vZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChuZXcgWEZvbyk7XG4vLzx4LWZvbz48L3gtZm9vPlxuLy92YXIgeEZvbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3gtZm9vJyk7XG5cbi8vZXh0ZW5kc1xuXG4vL3ZhciBYQnV0dG9uID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCd4LWJ1dHRvbicsIHtcbi8vcHJvdG90eXBlOiBPYmplY3QuY3JlYXRlKEhUTUxCdXR0b25FbGVtZW50LnByb3RvdHlwZSksXG4vL2V4dGVuZHM6ICdidXR0b24nXG4vL30pO1xuLy92YXIgYiA9IG5ldyBYQnV0dG9uO1xuLy9iLnRleHRDb250ZW50ID0gJ2NsaWNrIG1lJztcbi8vZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChiKTtcbi8vPHgtYnV0dG9uIGlzPVwiYnV0dG9uXCI+PC94LWJ1dHRvbj5cbi8vdmFyIHhCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nLCAneC1idXR0b24nKTtcblxuLy8gbWV0aG9kcyBhbmQgcHJvcGVydGllc1xuXG4vL3ZhciBYQmFyID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCd4LWJhcicsIHtcbi8vcHJvdG90eXBlOiBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSwge1xuLy9iYXI6IHtcbi8vZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIDU7IH1cbi8vfSxcbi8vZm9vOiB7XG4vL3ZhbHVlOiBmdW5jdGlvbigpIHtcbi8vY29uc29sZS5sb2coJ2ZvbygpIGNhbGxlZCcpO1xuLy99XG4vL31cbi8vfSlcbi8vfSk7XG4vL3ZhciB4YmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgneC1iYXInKTtcbi8vY29uc29sZS5sb2coJ2dldHRlcicsIHhiYXIuYmFyKTtcbi8veGJhci5mb28oKTtcblxuLy9saWZlY3ljbGUgb24gcHJvdGl0eXBlXG5cbi8vY3JlYXRlZENhbGxiYWNrIFx0YW4gaW5zdGFuY2Ugb2YgdGhlIGVsZW1lbnQgaXMgY3JlYXRlZFxuLy9hdHRhY2hlZENhbGxiYWNrIFx0YW4gaW5zdGFuY2Ugd2FzIGluc2VydGVkIGludG8gdGhlIGRvY3VtZW50XG4vL2RldGFjaGVkQ2FsbGJhY2sgXHRhbiBpbnN0YW5jZSB3YXMgcmVtb3ZlZCBmcm9tIHRoZSBkb2N1bWVudFxuLy9hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKSBcdGFuIGF0dHJpYnV0ZSB3YXMgYWRkZWQsIHJlbW92ZWQsIG9yIHVwZGF0ZWRcblxuLy92YXIgWEZvb1Byb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuXG4vL1hGb29Qcm90by5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbi8vdGhpcy5pbm5lckhUTUwgPSBcIjxiPkknbSBhbiB4LWZvby13aXRoLW1hcmt1cCE8L2I+XCI7XG4vL307XG5cbi8vdmFyIFhGb28gPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ3gtZm9vLXdpdGgtbWFya3VwJywge3Byb3RvdHlwZTogWEZvb1Byb3RvfSk7XG5cbi8vc2hhZG93IERPTVxuLy92YXIgWEZvb1Byb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUpO1xuXG4vL1hGb29Qcm90by5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbi8vLy8gMS4gQXR0YWNoIGEgc2hhZG93IHJvb3Qgb24gdGhlIGVsZW1lbnQuXG4vL3ZhciBzaGFkb3cgPSB0aGlzLmNyZWF0ZVNoYWRvd1Jvb3QoKTtcblxuLy8vLyAyLiBGaWxsIGl0IHdpdGggbWFya3VwIGdvb2RuZXNzLlxuLy9zaGFkb3cuaW5uZXJIVE1MID0gXCI8Yj5JJ20gaW4gdGhlIGVsZW1lbnQncyBTaGFkb3cgRE9NITwvYj5cIjtcbi8vfTtcblxuLy92YXIgWEZvbyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgneC1mb28tc2hhZG93ZG9tJywge3Byb3RvdHlwZTogWEZvb1Byb3RvfSk7XG5cbi8vdGVtcGxhdGUsIHNoYWRvdyBkb20gYW5kIHNjb3BlZCBzdHlsZVxuXG4vLzx0ZW1wbGF0ZSBpZD1cInNkdGVtcGxhdGVcIj5cbi8vPHN0eWxlPlxuLy9wIHsgY29sb3I6IG9yYW5nZTsgfVxuLy88L3N0eWxlPlxuLy88cD5JJ20gaW4gU2hhZG93IERPTS4gTXkgbWFya3VwIHdhcyBzdGFtcGVkIGZyb20gYSAmbHQ7dGVtcGxhdGUmZ3Q7LjwvcD5cbi8vPC90ZW1wbGF0ZT5cblxuLy88c2NyaXB0PlxuLy92YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSwge1xuLy9jcmVhdGVkQ2FsbGJhY2s6IHtcbi8vdmFsdWU6IGZ1bmN0aW9uKCkge1xuLy92YXIgdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNzZHRlbXBsYXRlJyk7XG4vL3ZhciBjbG9uZSA9IGRvY3VtZW50LmltcG9ydE5vZGUodC5jb250ZW50LCB0cnVlKTtcbi8vdGhpcy5jcmVhdGVTaGFkb3dSb290KCkuYXBwZW5kQ2hpbGQoY2xvbmUpO1xuLy99XG4vL31cbi8vfSk7XG4vL2RvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgneC1mb28tZnJvbS10ZW1wbGF0ZScsIHtwcm90b3R5cGU6IHByb3RvfSk7XG4vLzwvc2NyaXB0PlxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYlhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWlJc0ltWnBiR1VpT2lJdmFHOXRaUzlpWlhKMGNtRnVaQzlrWlhZdmNISnZhbVZqZEhNdlpuVjBkWEpsTG1wekwzQjFZbXhwWXk5cWN5OXpjbU12YzJGdGNHeGxMbXB6SWl3aWMyOTFjbU5sYzBOdmJuUmxiblFpT2x0ZGZRPT0iXX0=
