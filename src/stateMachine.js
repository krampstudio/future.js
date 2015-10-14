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
export default function stateMachine (...available){

    const enabled  = new Set();
    const currents = new Set();

    //check and enable
    for( let state of available ) {
        if(typeof state !== 'string'){
            throw new TypeError('Only strings are available for state names');
        }
        enabled.add(state);
    }


    /**
     * @typedef stateApi
     */
    const stateApi = {

        /**
         * List the available states
         * @returns {String[]} the available states
         */
        list(){
            return Array.from(enabled);
        },

        /**
         * set the current states
         * @param {String...} states - the state
         */
        set(...states){
            states
                .filter( state => enabled.has(state) )
                .forEach( state => currents.add(state) );
        },

        toggle(...states){

            states
                .filter( state => enabled.has(state) )
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
