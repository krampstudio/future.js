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

## Status

Experimental

## Done

 - Base set up: grunt, babel, browserify, handlebars
 - QUnit test
 - Web Component : register
 - Web Component : attributs definition, getter and setter
 - Web Component : event emitter : component extended lifecycle
 - Web Component : content definition from callback or external template

## TODO

### Arch

 - clean up public and create a clean sample
 - remove lo-dash ? It's heavy and some features overlap with ES6
 - integrate aja.js

### Web Component

 - attributes type inference, ie. boolean for attr with no value
 - re-render content on attribute change (if configured)
 - find a better way to attach the node instance to the events
 - implement states
 - methods
 - extends/is
 - Support HTML template in content
 - styling

### Tests

 - Handlebars templates
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
