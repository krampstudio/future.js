/* global -expect */

var fixture = {

    container : null,

    createContainer(id = 'fixture-container'){
        this.container = document.createElement('div');
        this.container.id = id;
        document.body.appendChild(this.container);
        return this.container;
    },

    load(name){
        if(window.__html__ && window.__html__[name]){
            this.container.innerHTML = window.__html__[name];
            console.log(this.container.innerHTML);
        } else {
            throw new Error('Unable to load fixture ' + name);
        }
    },

    clean(){
        this.container.innerHTML = '';
    }
};

module.exports = fixture;
