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
import 'babel/polyfill';

//re-export Future libraries
export { fwc as fwc } from './fwc.js';
export { router as router } from './router.js';

