/**
 * Future.js - 2015
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 */


/**
 */
export default function statify (...states){

    var currents = new Set();

    //check parameters
    states.forEach( state => {
        if(typeof state !== 'string'){
            throw new TypeError("Only strings are available for state names");
        }
    });

    /**
     * @typedef stateApi
     */
    const stateApi = {

        list(){

        },

        set(...values){

        },

        is(...values){

        }
    };

    return stateApi;
}
