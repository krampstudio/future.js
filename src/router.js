/**
 * Future.js - 2015
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 */

/**
 * @module fwc
 */
const eventify = require('./eventify.js');

var registry = new Map();

let router = function router (config){


    //strategy : History URL on popstate
    //strategy : on ajax request

    //event + condition -> load a service / register a component
/*
    on state change -> state
        if state == 'foo' -> register
        if state == 'bar' -> register

    on ajax load -> url
        if url == 'foo' -> register
        if url == 'bar' -> register

*/

    let routing = {

        register (...components){

            for(let comp of components){
                if(!registry.get(comp)){
                    registry.put(comp);
                    try {
                        require(comp);
                    } catch(e){
                        this.trigger('error', "Unable to load component" + e);
                    }
                }
            }
        },

        load (...modules){

            modules.forEach( module => {
                if(typeof module === 'function'){
                    module();
                }
            });

        },

        resolve (url){

        }
    };

    return eventify(routing);
};

/*

 router([{
    url : '/foo',
    regsiter : 'component1', 'component2',
    load : 'service1'
 }])

    then history.popstate -> resolve(url.state);

*/

module.exports = router;
