# future.js [![Build Status](https://travis-ci.org/krampstudio/future.js.svg?branch=master)](https://travis-ci.org/krampstudio/future.js) [![Sauce Test Status](https://saucelabs.com/buildstatus/krampstudio)](https://saucelabs.com/u/krampstudio)

!['Future.js'](https://github.com/krampstudio/future.js/blob/gh-pages/img/logo.png "Future.js")

Future is a stack for developing client side app.

It features :

- node.js as a basement
- npm for module and dependency management
- ES6/7 syntax through Babel.js
- Handlebars for templates
- A WebComponents layer (only CustomElements for now)
- Browserify to compile everything
- Grunt to automatize tasks
- QUnit for the tests

## Philosophy statements

 - browsers API are not (yet) reliable
 - library over framework
 - developer friendly
 - open to changes

## Browser Support

[![Sauce Test Status](https://saucelabs.com/browser-matrix/krampstudio.svg)](https://saucelabs.com/u/krampstudio)

Tested on :
 - Firefox 40, 42
 - Chrome 45
 - Safari 8
 - IE 11

## Samples

### Web Component

```javascript
var fwc = require('fwc');

fwc('load')                         //component name, default ns is f-
    .on('error', e => {             //listen on errors
        console.error('Ooops', e);
    })
    .on('click', elt => {           //native event delegation
        fetch(elt.src)
            .then( res => elt.target.innerHTML = res; )
            .catch( e => this.trigger('error', e); )
    })
    .access('target', {             //define getter/setters
        get(val){
            return document.querySelector(val);
        }
    })
    .register();                    //regsiter the component
```

```html
    <!-- instantiate in html -->
    <f-load src="foo.html" target=".foo">Load content</f-load>
```

## Help wanted

We will invade the earth, come onboard and you'll become famous and rich. We need help regarding:
 - Development for everything, future.js lacks a lots of features (see issues, take one and come into the future)
 - A killer web site with features, doc and getting started
 - Testing
 - Spreading the world

## Status

Experimental and in development

## Done

 - Base set up: grunt, babel, browserify, handlebars
 - QUnit test
 - Web Component : register
 - Web Component : custom namespace
 - Web Component : attributs definition, getter and setter, and type casting
 - Web Component : mehtod
 - Web Component : event emitter : component extended lifecycle and native event delegation
 - Web Component : content definition from callback or external template
 - Web Component : content re-render on attribute change (if udpate is set to true)
 - Web Component : extend from HTML element or another web component
 - Core : event emitter

## License

The MIT License (MIT)

Copyright (c) 2015 Bertrand CHEVRIER
