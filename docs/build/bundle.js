var app=function(){"use strict";function t(){}function n(t){return t()}function e(){return Object.create(null)}function o(t){t.forEach(n)}function r(t){return"function"==typeof t}function c(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}function u(t){t.parentNode.removeChild(t)}let s;function f(t){s=t}const a=[],i=[],l=[],d=[],p=Promise.resolve();let $=!1;function h(t){l.push(t)}let m=!1;const g=new Set;function y(){if(!m){m=!0;do{for(let t=0;t<a.length;t+=1){const n=a[t];f(n),_(n.$$)}for(f(null),a.length=0;i.length;)i.pop()();for(let t=0;t<l.length;t+=1){const n=l[t];g.has(n)||(g.add(n),n())}l.length=0}while(a.length);for(;d.length;)d.pop()();$=!1,m=!1,g.clear()}}function _(t){if(null!==t.fragment){t.update(),o(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(h)}}const b=new Set;function x(t,n){-1===t.$$.dirty[0]&&(a.push(t),$||($=!0,p.then(y)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function k(c,a,i,l,d,p,$=[-1]){const m=s;f(c);const g=c.$$={fragment:null,ctx:null,props:p,update:t,not_equal:d,bound:e(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(m?m.$$.context:[]),callbacks:e(),dirty:$,skip_bound:!1};let _=!1;if(g.ctx=i?i(c,a.props||{},((t,n,...e)=>{const o=e.length?e[0]:n;return g.ctx&&d(g.ctx[t],g.ctx[t]=o)&&(!g.skip_bound&&g.bound[t]&&g.bound[t](o),_&&x(c,t)),n})):[],g.update(),_=!0,o(g.before_update),g.fragment=!!l&&l(g.ctx),a.target){if(a.hydrate){const t=function(t){return Array.from(t.childNodes)}(a.target);g.fragment&&g.fragment.l(t),t.forEach(u)}else g.fragment&&g.fragment.c();a.intro&&((k=c.$$.fragment)&&k.i&&(b.delete(k),k.i(v))),function(t,e,c){const{fragment:u,on_mount:s,on_destroy:f,after_update:a}=t.$$;u&&u.m(e,c),h((()=>{const e=s.map(n).filter(r);f?f.push(...e):o(e),t.$$.on_mount=[]})),a.forEach(h)}(c,a.target,a.anchor),y()}var k,v;f(m)}function v(n){let e;return{c(){var t;t="h1",e=document.createElement(t),e.textContent="Svelte PWA Template"},m(t,n){!function(t,n,e){t.insertBefore(n,e||null)}(t,e,n)},p:t,i:t,o:t,d(t){t&&u(e)}}}const w=new class extends class{$destroy(){!function(t,n){const e=t.$$;null!==e.fragment&&(o(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}(this,1),this.$destroy=t}$on(t,n){const e=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return e.push(n),()=>{const t=e.indexOf(n);-1!==t&&e.splice(t,1)}}$set(t){var n;this.$$set&&(n=t,0!==Object.keys(n).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}{constructor(t){super(),k(this,t,null,v,c,{})}}({target:document.body,props:{}});return document.title=`${document.title}`,w}();
//# sourceMappingURL=bundle.js.map
