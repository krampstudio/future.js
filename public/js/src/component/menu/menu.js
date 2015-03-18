/*var menu = {
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
    attributes : [
        //selected : {
            //set (value){
                //this.data.selected = value;
            //}
        //},
        'id',
        'selected'
    ]
};*/


//<template id="sdtemplate">
  //<style>
    //p { color: orange; }
  //</style>
  //<p>I'm in Shadow DOM. My markup was stamped from a &lt;template&gt;.</p>
//</template>

//<script>


/*
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
menu.attributes.forEach(function (prop) {
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
*/
var fwc = require('../fwc.js');

fwc('menu')



//define DOM attributes
    .attributes(['id', 'selected'])

//map accessors
    .access('selected', {
        set(val){
            console.log('setter called from access', val);
            return 'f-' + val;
        }
    })

    .content('./menu.tpl')

//lifecycle

    .on('flow',     (cycle) => console.log('lifecycle', cycle) )
    .on('create',   function() {
       console.log('create', this, arguments);
    })
    .on('attach',   ()=> console.log('attach') )
    .on('detach',   ()=> console.log('detach') )
    .on('destroy',  ()=> console.log('destroy') )

//state

    .on('state',    (state)=> console.log('statechange', state) )
    .on('active',   ()=> console.log('active') )
    .on('show',     ()=> console.log('show') )
    .on('hide',     ()=> console.log('hide') )
    .on('disable',  ()=> console.log('disable') )

    .register();
