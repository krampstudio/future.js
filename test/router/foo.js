const fwc = require('fwc');

    console.log('hello');
    fwc('f-oo')
        .on('error', function(e){
            console.error(e);
        })
        .on('create', function(elt){
            console.log('created');
            elt.setAttribute('loaded', 'true');
        })
        .register();
