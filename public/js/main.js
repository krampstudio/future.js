(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/bertrand/dev/projects/future.js/public/js/src/component/menu/menu.js":[function(require,module,exports){
"use strict";

var menu = {
    states: {
        active: function active() {},
        disabled: function disabled() {},
        hidden: function hidden() {},
        "default": function _default() {}
    },
    attributes: {
        //selected : {
        //set (value){
        //this.data.selected = value;
        //}
        //},
        id: true,
        selected: true
    }
};

//<template id="sdtemplate">
//<style>
//p { color: orange; }
//</style>
//<p>I'm in Shadow DOM. My markup was stamped from a &lt;template&gt;.</p>
//</template>

//<script>

var props = {
    createdCallback: {
        value: function value() {
            console.log("created with selection", this, this.selected);
        }
    },
    attachedCallback: {
        value: function value() {
            console.log("attached", arguments);
        }
    },
    detachedCallback: {
        value: function value() {
            console.log("detached", arguments);
        }
    },
    attributeChangedCallback: {
        value: function value() {
            console.log("attr change ", arguments);
        }
    } };
Object.keys(menu.attributes).forEach(function (prop) {
    props[prop] = {
        get: function get() {
            console.log("get", prop);
            return this.getAttribute(prop);
        },
        set: function set(val) {
            console.log("set", prop, val);
            this.setAttribute(prop, val);
            //if(!this.data){
            //this.data = {};
            //}
            //this.data[prop] = val;
        }
    };

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

    //Object.defineProperty(proto, prop, {
    //get(){
    //console.log('getter');
    //return proto.data[prop];
    //},
    //set(value){
    //console.log('setter');
    //proto.data[prop] = value;
    //}
    //});
});
var proto = Object.create(HTMLElement.prototype, props);

document.registerElement("f-menu", {
    prototype: proto
});

},{}],"/home/bertrand/dev/projects/future.js/public/js/src/main.js":[function(require,module,exports){
"use strict";

var m = require("./component/menu/menu.js");

},{"./component/menu/menu.js":"/home/bertrand/dev/projects/future.js/public/js/src/component/menu/menu.js"}]},{},["/home/bertrand/dev/projects/future.js/public/js/src/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9iZXJ0cmFuZC9kZXYvcHJvamVjdHMvZnV0dXJlLmpzL3B1YmxpYy9qcy9zcmMvY29tcG9uZW50L21lbnUvbWVudS5qcyIsIi9ob21lL2JlcnRyYW5kL2Rldi9wcm9qZWN0cy9mdXR1cmUuanMvcHVibGljL2pzL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFJLElBQUksR0FBRztBQUNQLFVBQU0sRUFBRztBQUNMLGNBQU0sRUFBQyxrQkFBRyxFQUVUO0FBQ0QsZ0JBQVEsRUFBQyxvQkFBRyxFQUVYO0FBQ0QsY0FBTSxFQUFDLGtCQUFHLEVBRVQ7QUFDRCxtQkFBUSxvQkFBRyxFQUVWO0tBQ0o7QUFDRCxjQUFVLEVBQUc7Ozs7OztBQU1ULFVBQUUsRUFBRyxJQUFJO0FBQ1QsZ0JBQVEsRUFBRyxJQUFJO0tBQ2xCO0NBQ0osQ0FBQzs7Ozs7Ozs7Ozs7QUFjRixJQUFJLEtBQUssR0FBRztBQUNSLG1CQUFlLEVBQUc7QUFDZCxhQUFLLEVBQUEsaUJBQUU7QUFBRSxtQkFBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQUU7S0FDekU7QUFDRCxvQkFBZ0IsRUFBRztBQUNmLGFBQUssRUFBQSxpQkFBRTtBQUFFLG1CQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUFFO0tBQ2pEO0FBQ0Qsb0JBQWdCLEVBQUc7QUFDZixhQUFLLEVBQUEsaUJBQUU7QUFBRSxtQkFBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FBRTtLQUNqRDtBQUNELDRCQUF3QixFQUFHO0FBQ3ZCLGFBQUssRUFBQSxpQkFBRTtBQUFFLG1CQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUFFO0tBQ3JELEVBQ0osQ0FBQztBQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksRUFBRTtBQUNqRCxTQUFLLENBQUMsSUFBSSxDQUFDLEdBQUc7QUFDVixXQUFHLEVBQUEsZUFBRTtBQUNELG1CQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN6QixtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2xDO0FBQ0QsV0FBRyxFQUFBLGFBQUMsR0FBRyxFQUFDO0FBQ0osbUJBQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM5QixnQkFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7Ozs7O1NBS2hDO0tBQ0osQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F1QkwsQ0FBQyxDQUFDO0FBQ0gsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDOztBQUd4RCxRQUFRLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRTtBQUMvQixhQUFTLEVBQUcsS0FBSztDQUNwQixDQUFDLENBQUM7Ozs7O0FDL0ZILElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBtZW51ID0ge1xuICAgIHN0YXRlcyA6IHtcbiAgICAgICAgYWN0aXZlICgpIHtcblxuICAgICAgICB9LFxuICAgICAgICBkaXNhYmxlZCAoKSB7XG5cbiAgICAgICAgfSxcbiAgICAgICAgaGlkZGVuICgpIHtcblxuICAgICAgICB9LFxuICAgICAgICBkZWZhdWx0ICgpIHtcblxuICAgICAgICB9XG4gICAgfSxcbiAgICBhdHRyaWJ1dGVzIDoge1xuICAgICAgICAvL3NlbGVjdGVkIDoge1xuICAgICAgICAgICAgLy9zZXQgKHZhbHVlKXtcbiAgICAgICAgICAgICAgICAvL3RoaXMuZGF0YS5zZWxlY3RlZCA9IHZhbHVlO1xuICAgICAgICAgICAgLy99XG4gICAgICAgIC8vfSxcbiAgICAgICAgaWQgOiB0cnVlLFxuICAgICAgICBzZWxlY3RlZCA6IHRydWVcbiAgICB9XG59O1xuXG5cbi8vPHRlbXBsYXRlIGlkPVwic2R0ZW1wbGF0ZVwiPlxuICAvLzxzdHlsZT5cbiAgICAvL3AgeyBjb2xvcjogb3JhbmdlOyB9XG4gIC8vPC9zdHlsZT5cbiAgLy88cD5JJ20gaW4gU2hhZG93IERPTS4gTXkgbWFya3VwIHdhcyBzdGFtcGVkIGZyb20gYSAmbHQ7dGVtcGxhdGUmZ3Q7LjwvcD5cbi8vPC90ZW1wbGF0ZT5cblxuLy88c2NyaXB0PlxuXG5cblxudmFyIHByb3BzID0ge1xuICAgIGNyZWF0ZWRDYWxsYmFjayA6IHtcbiAgICAgICAgdmFsdWUoKXsgY29uc29sZS5sb2coJ2NyZWF0ZWQgd2l0aCBzZWxlY3Rpb24nLCB0aGlzLCB0aGlzLnNlbGVjdGVkKTsgfVxuICAgIH0sXG4gICAgYXR0YWNoZWRDYWxsYmFjayA6IHtcbiAgICAgICAgdmFsdWUoKXsgY29uc29sZS5sb2coJ2F0dGFjaGVkJywgYXJndW1lbnRzKTsgfVxuICAgIH0sXG4gICAgZGV0YWNoZWRDYWxsYmFjayA6IHtcbiAgICAgICAgdmFsdWUoKXsgY29uc29sZS5sb2coJ2RldGFjaGVkJywgYXJndW1lbnRzKTsgfVxuICAgIH0sXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrIDoge1xuICAgICAgICB2YWx1ZSgpeyBjb25zb2xlLmxvZygnYXR0ciBjaGFuZ2UgJywgYXJndW1lbnRzKTsgfVxuICAgIH0sXG59O1xuT2JqZWN0LmtleXMobWVudS5hdHRyaWJ1dGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgcHJvcHNbcHJvcF0gPSB7XG4gICAgICAgIGdldCgpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2dldCcsIHByb3ApO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKHByb3ApO1xuICAgICAgICB9LFxuICAgICAgICBzZXQodmFsKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZXQnLCBwcm9wLCB2YWwpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUocHJvcCwgdmFsKTtcbiAgICAgICAgICAgIC8vaWYoIXRoaXMuZGF0YSl7XG4gICAgICAgICAgICAgICAgLy90aGlzLmRhdGEgPSB7fTtcbiAgICAgICAgICAgIC8vfVxuICAgICAgICAgICAgLy90aGlzLmRhdGFbcHJvcF0gPSB2YWw7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy9iYXI6IHtcbiAgICAgIC8vZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIDU7IH1cbiAgICAvL30sXG4gICAgLy9mb286IHtcbiAgICAgIC8vdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdmb28oKSBjYWxsZWQnKTtcbiAgICAgIC8vfVxuICAgIC8vfVxuICAvL30pXG4vL30pO1xuXG4gICAgLy9PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sIHByb3AsIHtcbiAgICAgICAgLy9nZXQoKXtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2dldHRlcicpO1xuICAgICAgICAgICAgLy9yZXR1cm4gcHJvdG8uZGF0YVtwcm9wXTtcbiAgICAgICAgLy99LFxuICAgICAgICAvL3NldCh2YWx1ZSl7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXR0ZXInKTtcbiAgICAgICAgICAgIC8vcHJvdG8uZGF0YVtwcm9wXSA9IHZhbHVlO1xuICAgICAgICAvL31cbiAgICAvL30pO1xufSk7XG52YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSwgcHJvcHMpO1xuXG5cbmRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnZi1tZW51Jywge1xuICAgIHByb3RvdHlwZSA6IHByb3RvXG59KTtcbiIsInZhciBtID0gcmVxdWlyZSgnLi9jb21wb25lbnQvbWVudS9tZW51LmpzJyk7XG5cbiJdfQ==
