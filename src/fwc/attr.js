/**
* Future.js - 2015
 * @author Bertrand Chevrier <chevrier.bertrand@gmail.com>
 * @license MIT
 */

/**
 * Attribute stuffs for Future.js Web Component.
 * @module fwc/attr
 */

/**
 * used for casting type while retrieving/setting attr values
 */
export const caster = {
    boolean : {
        get(name){
            return this.hasAttribute(name);
        },
        set(value){
            return !!value;
        }
    },
    float : {
        get(name){
            return parseFloat(this.getAttribute(name));
        },
        set(value){
            return parseFloat(value);
        }
    },
    int : {
        get(name){
            return parseInt(this.getAttribute(name), 10);
        },
        set(value){
            return parseInt(value, 10);
        }
    },
    array : {
        get(name){
            return this.getAttribute(name)
                       .split(' ')
                       .filter( item => !!item);
        },
        set(value){
            return Array.from(value)
                        .filter( item => !!item)
                        .join(' ');
        }
    },
    ['string[]'] : {
        get(name){
            return this.getAttribute(name)
                       .split(' ')
                       .filter( item => !!item)
                       .map( item => item.toString());
        },
        set(value){
            return Array.from(value)
                        .filter( item => !!item)
                        .map( item => item.toString())
                        .join(' ');
        }
    },
    ['int[]'] : {
        get(name){
            return this.getAttribute(name)
                       .split(' ')
                       .map( item => parseInt(item, 10))
                       .filter( item => !isNaN(item));
        },
        set(value){
            return Array.from(value)
                        .map( item => parseInt(item, 10))
                        .filter( item => !isNaN(item))
                        .join(' ');
        }
    },
    ['float[]'] : {
        get(name){
            return this.getAttribute(name)
                       .split(' ')
                       .map( item => parseFloat(item))
                       .filter( item => !itemsNaN(item));
        },
        set(value){
            return Array.from(value)
                        .map( item => parseFloat(item))
                        .filter( item => !itemsNaN(item))
                        .join(' ');
        }
    },
    ['boolean[]'] : {
        get(name){
            return this.getAttribute(name)
                       .split(' ')
                       .map( item => item !== '0' && item !== 'false');
        },
        set(value){
            return Array.from(value)
                        .map( item => !!item ? 'true' : 'false')
                        .join(' ');
        }
    }
};

//type aliases
caster.bool    = caster.boolean;
caster.double  = caster.float;
caster.number  = caster.float;
caster.integer = caster.int;
caster['[]']   = caster.array;
caster['integer[]']   = caster['int[]'];
caster['double[]']   = caster['float[]'];
caster['number[]']   = caster['float[]'];
caster['bool[]']   = caster['boolean[]'];

