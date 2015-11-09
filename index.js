/**
 * Future.js - 2015
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 */

/**
 * Future.js entry point.
 * @module future
 */

//load the ES6 polyfill
import 'babel-polyfill';

//re-export Future libraries
import fwc from './src/fwc.js';
import router from './src/router.js';

export {
    fwc,
    router
};

