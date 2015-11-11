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
         * @param {String...} states - the states to set
         */
        set(...states){
            states
                .filter( state => enabled.has(state) )
                .forEach( state => currents.add(state) );
        },

        /**
         * Toggle states. If current then remove otherwise set it.
         * @param {String...} states - the states to toggle
         */
        toggle(...states){
            states
                .filter( state => enabled.has(state) )
                .forEach( state => {
                    if(this.is(state)){
                        this.remove(state);
                    } else {
                        this.set(state);
                    }
                });
        },

        /**
         * Check whether the given state was set
         * @param {String} states - the state to check
         * @returns {Boolean} true if current
         */
        is(state){
            return currents.has(state);
        },

        /**
         * Remove (unset) the given states
         * @param {String...} states - the states to remove
         */
        remove(...states){
            states
                .filter( state => enabled.has(state) )
                .forEach( state => currents.delete(state) );
        },

        /**
         * Clear all current states
         */
        clear(){
            currents.clear();
        }
    };

    return stateApi;
}
