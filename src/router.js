/**
 * Future.js - 2015
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 */

/**
 * @module fwc
 */
const eventify = require('./eventify.js');
const url      = require('url');

var registry = new Map();

let router = function router (routes = []){

    var routeStack = [];

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
            return this;
        },

        load (...modules){

            modules.forEach( module => {
                if(typeof module === 'function'){
                    module();
                }
            });

            return this;
        },

        resolve (path){
            let exec = route => {
                this.register(...route.register);
                this.load(...route.modules);
            };

            //let toResolve = url.parse(path);

            for(let route of routeStack){
                if(route.url === '*' || route.url ===  path){
                    return exec(route);
                }
               //todo resolve chunks

            }
        },

        add(routes = []){

            if(typeof routes === 'object' && typeof routes.url === 'string'){
                routes = [routes];
            }

            for(let route of routes) {
                if(typeof route !== 'object'){
                    throw new TypeError('A route is always a plain object');
                }
                if(typeof route.url !== 'string' || route.url.length <= 0){
                    throw new TypeError('A route must have an url property');
                }
                if( !route.register && !route.load){
                    throw new TypeError('A route define at least a register or a load action');
                }

                if(typeof route.register === 'string'){
                    route.register = [route.register];
                }
                if(typeof route.load === 'function'){
                    route.load = [route.load];
                }
                routeStack.push(route);
            }

            return this;
        }
    };


    return eventify(routing).add(routes);
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
