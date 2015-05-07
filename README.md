# future.js

!['Future.js'](public/img/logo.png "Future.js")

Future is a stack for developing client side app.

It features :

- node.js as a basement
- npm for module and dependency management
- ES6 syntax through Babel.js
- Handlebars for templates
- A WebComponents layer (only CustomElements for now)
- Browserify to compile everything
- Grunt to automatize tasks
- QUnit for the tests

## Philosophy statements

 - browsers API are not reliable
 - library over framework
 - developer friendly
 - open to changes
 - stability

## Help wanted

We will invade the earth, come onboard and you'll become famous and rich. We need help regarding:
 - Development for everything, future.js lacks a lots of features
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
 - Web Component : event emitter : component extended lifecycle
 - Web Component : content definition from callback or external template
 - Web Component : content re-render on attribute change (if udpate is set to true)

## TODO

### Arch

 - clean up public and create a clean sample
 - remove lo-dash ? It's heavy and some features overlap with ES6
 - integrate aja.js

### Web Component

 - attributes multivalue type
 - render event (linked to DOM `change` event)
 - find a better way to attach the node instance to the events
 - implement states
 - methods
 - extends/is
 - Support HTML template in content
 - styling
 - jsdoc fwc

### Router

 - core Router
 - API
 - register components dynamically
 - DI integration

### Services

 - Service structure and registration (or DI)

### Tests

 - Test with multiple components of the same type
 - automatize qunit tests (needs to run test.html; so karma may be removed). Need to test polyfill with phantomJS >= 2.0.0
 - integrate sauce labs to see the real browser support
 - code coverage

### Bundling

 - separate libraries from source
 - separate source map (or look for a format that firefox can read)
 - uglify the final bundle

## License

The MIT License (MIT)

Copyright (c) 2015 Bertrand CHEVRIER
