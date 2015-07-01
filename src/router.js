/**
 * Future.js - 2015
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 */

/**
 * @module fwc
 */
const eventify = require('./eventify.js');
const UrlPattern = require('url-pattern');

/**
 * Keep track of components registered
 */
let registry = new Map();

/**
 * @typedef route
 * @property {String|Regex} url - the URL pattern of the route
 * @property {String[]|String} [register] - collection of modules paths to register on match
 * @property {Function[]|Function} [load]  - collection of functions to call on match
 */

/**
 * The router creates a routing mechanism from routes.
 * It helps you to load functions or to register components based on URLs.
 *
 * @param {route[]} [routes = []] - the routes to add to the routes
 * @returns {routing} the routing object
 */
let router = function router (routes = []){

    let routeStack = [];

    /**
     * @typedef routing
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
                if(route.register){
                    this.register(...route.register);
                }
                if(route.load){
                    this.load(...route.load);
                }
            };

            for(let route of routeStack){
                if(route.url === '*' || route.url ===  path){
                    return exec(route);
                }

                let pattern = new UrlPattern(route.url);
                if(pattern.match(path)){
                    return exec(route);
                }

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
