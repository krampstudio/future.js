/**
 * Future.js - 2015
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 */

/**
 * @module router
 */
const UrlPattern = require('url-pattern');

/**
 * Keep track of components registered
 */
let registry = new Set();

/**
 * @typedef route
 * @property {String|Regex} url - the URL pattern of the route
 * @property {Function[]} handlers = [] - functions to execute when the route is resolved
 * @property {Boolean} [once = false]  - the handlers will be executed only one time
 */

/**
 * The router creates a routing mechanism from routes.
 * It helps you to load functions or to register components based on URLs.
 *
 * @param {route[]} [routes = []] - the routes to add to the routes
 * @returns {routing} the routing object
 * @throws TypeError if the routes aren't correclty formater
 */
export default function router (routes = []){


    /**
     * Contains the routes (url/{handlers,once})
     */
    let routeStack = new Map();

    /**
     * @typedef routing
     */
    let routing = {

        /**
         * Resolve an URL against the current route stack
         * @param {String} url - the URL to resolve
         */
        resolve (url){

            //exec the handlers of the route
            let exec = (routeUrl, route) => {
                if(route.once){
                    if(registry.has(routeUrl)){
                        return;
                    }
                    registry.add(routeUrl);
                }
                route.handlers.forEach( handler => {
                    if(typeof handler === 'function'){
                        handler();
                    }
                });
            };

            //resolve the stack
            for(let [routeUrl, route] of routeStack.entries()){
                if(routeUrl === '*' || routeUrl === url){
                    return exec(routeUrl, route);
                }

                //match the url as a pattern
                let pattern = new UrlPattern(routeUrl);
                if(pattern.match(url)){
                    return exec(routeUrl, route);
                }
            }
        },

        /**
         * Add a route to the stack
         * @param {route} route - the route to add
         * @returns {routing} for chaining
         * @throws TypeError if the route isn't correcly formated
         */
        add({ url, handlers = [], once = false } = {}){
            if(typeof url !== 'string' || url.length <= 0){
                throw new TypeError('the route key must be an URL');
            }
            if(!handlers || ( (!Array.isArray(handlers) || !handlers.length) && typeof handlers !== 'function')){
                throw new TypeError('A route must have at least one handler');
            }

            if(typeof handlers === 'function'){
                handlers = [handlers];
            }
            routeStack.set(url, {handlers, once});

            return this;
        },
    };

    routes.forEach( route => routing.add(route));

    return routing;
};
