/**
 * Future.js - 2015
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 */


/**
 * Creates a state context
 *
 * @example
 * let state = stateFactory('active', 'hidden', 'enabled')
 * state.set('active');
 * state.is('active');
 *
 * @param {String[]} available - the list of available states
 * @returns {stateApi} a new state api
 */
export default function stateFactory (...available){

    const currents = new Set();

    //check parameters
    for( let state of available ) {
        if(typeof state !== 'string'){
            throw new TypeError('Only strings are available for state names');
        }
    }

    /**
     * @typedef stateApi
     */
    const stateApi = {

        list(){
            return available;
        },

        set(...states){
            states
                .filter( state => available.indexOf(state) > -1)
                .forEach( state => currents.add(state) );
        },

        toggle(...states){

            states
                .filter( state => available.indexOf(state) > -1)
                .forEach( state => {
                    if(this.is(state)){
                        this.delete(state);
                    } else {
                        this.set(state);
                    }
                });
        },

        is(state){
            return currents.has(state);
        },
        remove(state){
            currents.delete(state);
        },
        clear(){
            currents.clear();
        }
    };

    return stateApi;
}
