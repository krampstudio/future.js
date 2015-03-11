var menu = {
    states : {
        active () {

        },
        disabled () {

        },
        hidden () {

        },
        default () {

        }
    },
    attributes : {
        //selected : {
            //set (value){
                //this.data.selected = value;
            //}
        //},
        id : true,
        selected : true
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
    createdCallback : {
        value(){ console.log('created with selection', this, this.selected); }
    },
    attachedCallback : {
        value(){ console.log('attached', arguments); }
    },
    detachedCallback : {
        value(){ console.log('detached', arguments); }
    },
    attributeChangedCallback : {
        value(){ console.log('attr change ', arguments); }
    },
};
Object.keys(menu.attributes).forEach(function (prop) {
    props[prop] = {
        get(){
            console.log('get', prop);
            return this.getAttribute(prop);
        },
        set(val){
            console.log('set', prop, val);
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


document.registerElement('f-menu', {
    prototype : proto
});
