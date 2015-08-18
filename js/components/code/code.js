import { fwc } from 'future.js';
import prism   from 'prismjs';

fwc('code')
    .on('error', (e) => console.error(e))
    .on('create', function(elt){
        let lang = elt.lang;
        if(!lang || !prism.languages.hasOwnProperty(lang)){
            return this.trigger('error', new Error('unsupported language : ' + lang));
        }
        let hlContent = prism.highlight(elt.textContent.trim(), prism.languages[lang]);
        elt.innerHTML = `<pre class="language-${lang}"><code class="language-${lang}">${hlContent}</code></pre>`;
    })
    .attrs('lang')
    .register();
