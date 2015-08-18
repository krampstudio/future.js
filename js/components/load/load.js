import { fwc } from 'future.js';

// load is the component name, it uses the default namespace 'f-'
fwc('load')

  //listen on errors
  .on('error', e => {
    console.error('Ooops', e);
  })

  //native event delegation
  .on('click', function (elt) {

    window.fetch (elt.src)
      .then( res => res.text() )
      .then( html => elt.target.innerHTML = html)
      .catch( e => this.trigger('error', e) );
  })

  //attributes
  .attrs('src', 'target')

  //define getter/setters
  .access('target', {
    get (val){
      //elt.target will return a DOM element
      return document.querySelector(val);
    }
  })

  //regsiter the component
  .register();
