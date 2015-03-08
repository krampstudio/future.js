//simple

var XFoo = document.registerElement('x-foo');
document.body.appendChild(new XFoo);
//<x-foo></x-foo>
//var xFoo = document.createElement('x-foo');


//extends

var XButton = document.registerElement('x-button', {
    prototype: Object.create(HTMLButtonElement.prototype),
    extends: 'button'
});
var b = new XButton;
b.textContent = 'click me';
document.body.appendChild(b);
//<x-button is="button"></x-button>
//var xButton = document.createElement('button', 'x-button');



// methods and properties

var XBar = document.registerElement('x-bar', {
  prototype: Object.create(HTMLElement.prototype, {
    bar: {
      get: function() { return 5; }
    },
    foo: {
      value: function() {
        console.log('foo() called');
      }
    }
  })
});
var xbar = document.createElement('x-bar');
console.log('getter', xbar.bar);
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
