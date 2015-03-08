(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/bertrand/dev/projects/future.js/public/js/src/main.js":[function(require,module,exports){
"use strict";

//simple

var XFoo = document.registerElement("x-foo");
document.body.appendChild(new XFoo());
//<x-foo></x-foo>
//var xFoo = document.createElement('x-foo');

//extends

var XButton = document.registerElement("x-button", {
  prototype: Object.create(HTMLButtonElement.prototype),
  "extends": "button"
});
var b = new XButton();
b.textContent = "click me";
document.body.appendChild(b);
//<x-button is="button"></x-button>
//var xButton = document.createElement('button', 'x-button');

// methods and properties

var XBar = document.registerElement("x-bar", {
  prototype: Object.create(HTMLElement.prototype, {
    bar: {
      get: function get() {
        return 5;
      }
    },
    foo: {
      value: function value() {
        console.log("foo() called");
      }
    }
  })
});
var xbar = document.createElement("x-bar");
console.log("getter", xbar.bar);
xbar.foo();

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

},{}]},{},["/home/bertrand/dev/projects/future.js/public/js/src/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9iZXJ0cmFuZC9kZXYvcHJvamVjdHMvZnV0dXJlLmpzL3B1YmxpYy9qcy9zcmMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNFQSxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzdDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksSUFBSSxFQUFBLENBQUMsQ0FBQzs7Ozs7O0FBT3BDLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFO0FBQy9DLFdBQVMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQztBQUNyRCxhQUFTLFFBQVE7Q0FDcEIsQ0FBQyxDQUFDO0FBQ0gsSUFBSSxDQUFDLEdBQUcsSUFBSSxPQUFPLEVBQUEsQ0FBQztBQUNwQixDQUFDLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztBQUMzQixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Ozs7O0FBUTdCLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFO0FBQzNDLFdBQVMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUU7QUFDOUMsT0FBRyxFQUFFO0FBQ0gsU0FBRyxFQUFFLGVBQVc7QUFBRSxlQUFPLENBQUMsQ0FBQztPQUFFO0tBQzlCO0FBQ0QsT0FBRyxFQUFFO0FBQ0gsV0FBSyxFQUFFLGlCQUFXO0FBQ2hCLGVBQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7T0FDN0I7S0FDRjtHQUNGLENBQUM7Q0FDSCxDQUFDLENBQUM7QUFDSCxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNoQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy9zaW1wbGVcblxudmFyIFhGb28gPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ3gtZm9vJyk7XG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG5ldyBYRm9vKTtcbi8vPHgtZm9vPjwveC1mb28+XG4vL3ZhciB4Rm9vID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgneC1mb28nKTtcblxuXG4vL2V4dGVuZHNcblxudmFyIFhCdXR0b24gPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ3gtYnV0dG9uJywge1xuICAgIHByb3RvdHlwZTogT2JqZWN0LmNyZWF0ZShIVE1MQnV0dG9uRWxlbWVudC5wcm90b3R5cGUpLFxuICAgIGV4dGVuZHM6ICdidXR0b24nXG59KTtcbnZhciBiID0gbmV3IFhCdXR0b247XG5iLnRleHRDb250ZW50ID0gJ2NsaWNrIG1lJztcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYik7XG4vLzx4LWJ1dHRvbiBpcz1cImJ1dHRvblwiPjwveC1idXR0b24+XG4vL3ZhciB4QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJywgJ3gtYnV0dG9uJyk7XG5cblxuXG4vLyBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzXG5cbnZhciBYQmFyID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCd4LWJhcicsIHtcbiAgcHJvdG90eXBlOiBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSwge1xuICAgIGJhcjoge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIDU7IH1cbiAgICB9LFxuICAgIGZvbzoge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnZm9vKCkgY2FsbGVkJyk7XG4gICAgICB9XG4gICAgfVxuICB9KVxufSk7XG52YXIgeGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3gtYmFyJyk7XG5jb25zb2xlLmxvZygnZ2V0dGVyJywgeGJhci5iYXIpO1xueGJhci5mb28oKTtcblxuXG5cbi8vbGlmZWN5Y2xlIG9uIHByb3RpdHlwZVxuXG4vL2NyZWF0ZWRDYWxsYmFjayBcdGFuIGluc3RhbmNlIG9mIHRoZSBlbGVtZW50IGlzIGNyZWF0ZWRcbi8vYXR0YWNoZWRDYWxsYmFjayBcdGFuIGluc3RhbmNlIHdhcyBpbnNlcnRlZCBpbnRvIHRoZSBkb2N1bWVudFxuLy9kZXRhY2hlZENhbGxiYWNrIFx0YW4gaW5zdGFuY2Ugd2FzIHJlbW92ZWQgZnJvbSB0aGUgZG9jdW1lbnRcbi8vYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHJOYW1lLCBvbGRWYWwsIG5ld1ZhbCkgXHRhbiBhdHRyaWJ1dGUgd2FzIGFkZGVkLCByZW1vdmVkLCBvciB1cGRhdGVkXG5cbi8vdmFyIFhGb29Qcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlKTtcblxuLy9YRm9vUHJvdG8uY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gIC8vdGhpcy5pbm5lckhUTUwgPSBcIjxiPkknbSBhbiB4LWZvby13aXRoLW1hcmt1cCE8L2I+XCI7XG4vL307XG5cbi8vdmFyIFhGb28gPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ3gtZm9vLXdpdGgtbWFya3VwJywge3Byb3RvdHlwZTogWEZvb1Byb3RvfSk7XG5cblxuLy9zaGFkb3cgRE9NXG4vL3ZhciBYRm9vUHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSk7XG5cbi8vWEZvb1Byb3RvLmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAvLy8vIDEuIEF0dGFjaCBhIHNoYWRvdyByb290IG9uIHRoZSBlbGVtZW50LlxuICAvL3ZhciBzaGFkb3cgPSB0aGlzLmNyZWF0ZVNoYWRvd1Jvb3QoKTtcblxuICAvLy8vIDIuIEZpbGwgaXQgd2l0aCBtYXJrdXAgZ29vZG5lc3MuXG4gIC8vc2hhZG93LmlubmVySFRNTCA9IFwiPGI+SSdtIGluIHRoZSBlbGVtZW50J3MgU2hhZG93IERPTSE8L2I+XCI7XG4vL307XG5cbi8vdmFyIFhGb28gPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ3gtZm9vLXNoYWRvd2RvbScsIHtwcm90b3R5cGU6IFhGb29Qcm90b30pO1xuXG5cbi8vdGVtcGxhdGUsIHNoYWRvdyBkb20gYW5kIHNjb3BlZCBzdHlsZVxuXG4vLzx0ZW1wbGF0ZSBpZD1cInNkdGVtcGxhdGVcIj5cbiAgLy88c3R5bGU+XG4gICAgLy9wIHsgY29sb3I6IG9yYW5nZTsgfVxuICAvLzwvc3R5bGU+XG4gIC8vPHA+SSdtIGluIFNoYWRvdyBET00uIE15IG1hcmt1cCB3YXMgc3RhbXBlZCBmcm9tIGEgJmx0O3RlbXBsYXRlJmd0Oy48L3A+XG4vLzwvdGVtcGxhdGU+XG5cbi8vPHNjcmlwdD5cbi8vdmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUsIHtcbiAgLy9jcmVhdGVkQ2FsbGJhY2s6IHtcbiAgICAvL3ZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vdmFyIHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjc2R0ZW1wbGF0ZScpO1xuICAgICAgLy92YXIgY2xvbmUgPSBkb2N1bWVudC5pbXBvcnROb2RlKHQuY29udGVudCwgdHJ1ZSk7XG4gICAgICAvL3RoaXMuY3JlYXRlU2hhZG93Um9vdCgpLmFwcGVuZENoaWxkKGNsb25lKTtcbiAgICAvL31cbiAgLy99XG4vL30pO1xuLy9kb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ3gtZm9vLWZyb20tdGVtcGxhdGUnLCB7cHJvdG90eXBlOiBwcm90b30pO1xuLy88L3NjcmlwdD5cbiJdfQ==
