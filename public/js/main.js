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

var props = {};
Object.keys(menu.attributes).forEach(function (prop) {
    props[prop] = {
        get: function get() {
            console.log("get", prop);
            if (!this.data) {
                this.data = {};
            }
            return this.data[prop];
        },
        set: function set(val) {
            console.log("set", prop, val);
            if (!this.data) {
                this.data = {};
            }
            this.data[prop] = val;
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
console.log(props);
var proto = Object.create(HTMLElement.prototype, props);
proto.createdCallback = function () {
    console.log("Created");
};

document.registerElement("f-menu", {
    prototype: proto
});

},{}],"/home/bertrand/dev/projects/future.js/public/js/src/main.js":[function(require,module,exports){
"use strict";

var m = require("./component/menu/menu.js");

},{"./component/menu/menu.js":"/home/bertrand/dev/projects/future.js/public/js/src/component/menu/menu.js"}]},{},["/home/bertrand/dev/projects/future.js/public/js/src/main.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9iZXJ0cmFuZC9kZXYvcHJvamVjdHMvZnV0dXJlLmpzL3B1YmxpYy9qcy9zcmMvY29tcG9uZW50L21lbnUvbWVudS5qcyIsIi9ob21lL2JlcnRyYW5kL2Rldi9wcm9qZWN0cy9mdXR1cmUuanMvcHVibGljL2pzL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFJLElBQUksR0FBRztBQUNQLFVBQU0sRUFBRztBQUNMLGNBQU0sRUFBQyxrQkFBRyxFQUVUO0FBQ0QsZ0JBQVEsRUFBQyxvQkFBRyxFQUVYO0FBQ0QsY0FBTSxFQUFDLGtCQUFHLEVBRVQ7QUFDRCxtQkFBUSxvQkFBRyxFQUVWO0tBQ0o7QUFDRCxjQUFVLEVBQUc7Ozs7OztBQU1ULFVBQUUsRUFBRyxJQUFJO0FBQ1QsZ0JBQVEsRUFBRyxJQUFJO0tBQ2xCO0NBQ0osQ0FBQzs7Ozs7Ozs7Ozs7QUFjRixJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDZixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLEVBQUU7QUFDakQsU0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHO0FBQ1YsV0FBRyxFQUFBLGVBQUU7QUFDRCxtQkFBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDekIsZ0JBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0FBQ1Ysb0JBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO2FBQ2xCO0FBQ0QsbUJBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxQjtBQUNELFdBQUcsRUFBQSxhQUFDLEdBQUcsRUFBQztBQUNKLG1CQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDOUIsZ0JBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFDO0FBQ1Ysb0JBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO2FBQ2xCO0FBQ0QsZ0JBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1NBQ3pCO0tBQ0osQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F1QkwsQ0FBQyxDQUFDO0FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNuQixJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDeEQsS0FBSyxDQUFDLGVBQWUsR0FBRyxZQUFXO0FBQy9CLFdBQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Q0FDMUIsQ0FBQzs7QUFHRixRQUFRLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRTtBQUMvQixhQUFTLEVBQUcsS0FBSztDQUNwQixDQUFDLENBQUM7Ozs7O0FDeEZILElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBtZW51ID0ge1xuICAgIHN0YXRlcyA6IHtcbiAgICAgICAgYWN0aXZlICgpIHtcblxuICAgICAgICB9LFxuICAgICAgICBkaXNhYmxlZCAoKSB7XG5cbiAgICAgICAgfSxcbiAgICAgICAgaGlkZGVuICgpIHtcblxuICAgICAgICB9LFxuICAgICAgICBkZWZhdWx0ICgpIHtcblxuICAgICAgICB9XG4gICAgfSxcbiAgICBhdHRyaWJ1dGVzIDoge1xuICAgICAgICAvL3NlbGVjdGVkIDoge1xuICAgICAgICAgICAgLy9zZXQgKHZhbHVlKXtcbiAgICAgICAgICAgICAgICAvL3RoaXMuZGF0YS5zZWxlY3RlZCA9IHZhbHVlO1xuICAgICAgICAgICAgLy99XG4gICAgICAgIC8vfSxcbiAgICAgICAgaWQgOiB0cnVlLFxuICAgICAgICBzZWxlY3RlZCA6IHRydWVcbiAgICB9XG59O1xuXG5cbi8vPHRlbXBsYXRlIGlkPVwic2R0ZW1wbGF0ZVwiPlxuICAvLzxzdHlsZT5cbiAgICAvL3AgeyBjb2xvcjogb3JhbmdlOyB9XG4gIC8vPC9zdHlsZT5cbiAgLy88cD5JJ20gaW4gU2hhZG93IERPTS4gTXkgbWFya3VwIHdhcyBzdGFtcGVkIGZyb20gYSAmbHQ7dGVtcGxhdGUmZ3Q7LjwvcD5cbi8vPC90ZW1wbGF0ZT5cblxuLy88c2NyaXB0PlxuXG5cblxudmFyIHByb3BzID0ge307XG5PYmplY3Qua2V5cyhtZW51LmF0dHJpYnV0ZXMpLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICBwcm9wc1twcm9wXSA9IHtcbiAgICAgICAgZ2V0KCl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZ2V0JywgcHJvcCk7XG4gICAgICAgICAgICBpZighdGhpcy5kYXRhKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRhdGFbcHJvcF07XG4gICAgICAgIH0sXG4gICAgICAgIHNldCh2YWwpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3NldCcsIHByb3AsIHZhbCk7XG4gICAgICAgICAgICBpZighdGhpcy5kYXRhKXtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEgPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGF0YVtwcm9wXSA9IHZhbDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvL2Jhcjoge1xuICAgICAgLy9nZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gNTsgfVxuICAgIC8vfSxcbiAgICAvL2Zvbzoge1xuICAgICAgLy92YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2ZvbygpIGNhbGxlZCcpO1xuICAgICAgLy99XG4gICAgLy99XG4gIC8vfSlcbi8vfSk7XG5cbiAgICAvL09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90bywgcHJvcCwge1xuICAgICAgICAvL2dldCgpe1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnZ2V0dGVyJyk7XG4gICAgICAgICAgICAvL3JldHVybiBwcm90by5kYXRhW3Byb3BdO1xuICAgICAgICAvL30sXG4gICAgICAgIC8vc2V0KHZhbHVlKXtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3NldHRlcicpO1xuICAgICAgICAgICAgLy9wcm90by5kYXRhW3Byb3BdID0gdmFsdWU7XG4gICAgICAgIC8vfVxuICAgIC8vfSk7XG59KTtcbmNvbnNvbGUubG9nKHByb3BzKTtcbnZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlLCBwcm9wcyk7XG5wcm90by5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygnQ3JlYXRlZCcpO1xufTtcblxuXG5kb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ2YtbWVudScsIHtcbiAgICBwcm90b3R5cGUgOiBwcm90b1xufSk7XG4iLCJ2YXIgbSA9IHJlcXVpcmUoJy4vY29tcG9uZW50L21lbnUvbWVudS5qcycpO1xuXG4iXX0=
