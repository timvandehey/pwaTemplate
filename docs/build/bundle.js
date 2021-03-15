
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const logs = writable([]);
    const noAuth = { auth: false };
    const user = writable(noAuth);


    const pad = (n, num = 2) => String(n).padStart(num, '0');

    const getTime = () => {
        const d = new Date();
        const h = pad(d.getHours());
        const m = pad(d.getMinutes());
        const s = pad(d.getSeconds());
        const ms = pad(d.getMilliseconds(), 3);
        return `${h}:${m}:${s}:${ms} `
    };

    function Logger (summary = "", ...details) {
        const l = details.length;
        if (l == 0) details = summary;
        if (l == 1) details = details[0];
        const event = { time: getTime(), summary, details };
        logs.update(prev => [...prev, event]);
    }

    function log (...args) {
        {
            const sampleSize = 100;
            const sampleJSON = JSON.stringify([...args]);
            let s1 = sampleJSON;
            let s2 = '';
            let css = '';
            if (sampleJSON.length > sampleSize) {
                s1 = sampleJSON.slice(0, sampleSize);
                s2 = ' %c ...more ';
                css = 'color:white;background:green;font-size:.8em;';
            }
            console.groupCollapsed(s1 + s2, css);
            console.log.apply(null, args);
            console.groupCollapsed('   ...log trace HERE collapsed');
            console.trace();
            console.groupEnd();
            console.groupEnd();
        }
        Logger.apply(null, args);
    }

    const currentUser = () => get_store_value(user);

    async function server (dbName = '', fnName = 'echo', fnArgsArray = []) {
        const url =
            `https://script.google.com/macros/s/AKfycbya4Lt5XG7upra-dUMX5BD50YKbCjhuWx_NvIT4nI2eeZh58H6G/exec`;
        const request = {
            user: currentUser()
            , dbName
            , fnName
            , args: fnArgsArray
        };
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(request)
        })
            .then(res => res.json());
        log(1, response);
        if (response.hadError) {
            // if (response.error.type == 'userPwdError') user.set({ ...noAuth, ...response.error })
            log(response.error);
        }
        return response
    }

    const CLIENT_ID = "85671938027-9tjqlgm07qejltr1tpp4o016e12t9nn8.apps.googleusercontent.com";
    const API_KEY = "AIzaSyDDEgXF-oa4R7HyC6ZqBDg5ahPJnDkWyOk";

    /* src/Icon.svelte generated by Svelte v3.32.3 */

    const file = "src/Icon.svelte";

    // (1:35) face
    function fallback_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("face");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(1:35) face",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let span;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(span, "class", "material-icons");
    			add_location(span, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(span, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/Apitest.svelte generated by Svelte v3.32.3 */
    const file$1 = "src/Apitest.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (84:4) {#each tests as test}
    function create_each_block(ctx) {
    	let option;
    	let t_value = JSON.stringify(/*test*/ ctx[9]) + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*test*/ ctx[9];
    			option.value = option.__value;
    			add_location(option, file$1, 84, 8, 2321);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tests*/ 16 && t_value !== (t_value = JSON.stringify(/*test*/ ctx[9]) + "")) set_data_dev(t, t_value);

    			if (dirty & /*tests*/ 16 && option_value_value !== (option_value_value = /*test*/ ctx[9])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(84:4) {#each tests as test}",
    		ctx
    	});

    	return block;
    }

    // (89:0) {#if retrieving}
    function create_if_block_1(ctx) {
    	let pre;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			pre.textContent = "getting data ...";
    			add_location(pre, file$1, 89, 4, 2456);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(89:0) {#if retrieving}",
    		ctx
    	});

    	return block;
    }

    // (92:0) {#if open}
    function create_if_block(ctx) {
    	let pre0;
    	let icon0;
    	let t0;
    	let t1_value = JSON.stringify(JSON.parse(/*data*/ ctx[1].extra.request.postData.contents), null, 2) + "";
    	let t1;
    	let t2;
    	let pre1;
    	let icon1;
    	let t3;
    	let t4_value = JSON.stringify(/*data*/ ctx[1], null, 2) + "";
    	let t4;
    	let t5;
    	let pre2;
    	let icon2;
    	let t6;
    	let t7_value = /*data*/ ctx[1].extra.logs + "";
    	let t7;
    	let current;
    	icon0 = new Icon({ props: { i: "input" }, $$inline: true });
    	icon1 = new Icon({ props: { i: "output" }, $$inline: true });
    	icon2 = new Icon({ props: { i: "log" }, $$inline: true });

    	const block = {
    		c: function create() {
    			pre0 = element("pre");
    			create_component(icon0.$$.fragment);
    			t0 = text(" ");
    			t1 = text(t1_value);
    			t2 = space();
    			pre1 = element("pre");
    			create_component(icon1.$$.fragment);
    			t3 = text(" ");
    			t4 = text(t4_value);
    			t5 = space();
    			pre2 = element("pre");
    			create_component(icon2.$$.fragment);
    			t6 = text("\n");
    			t7 = text(t7_value);
    			add_location(pre0, file$1, 92, 4, 2505);
    			add_location(pre1, file$1, 95, 4, 2628);
    			add_location(pre2, file$1, 96, 4, 2695);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre0, anchor);
    			mount_component(icon0, pre0, null);
    			append_dev(pre0, t0);
    			append_dev(pre0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, pre1, anchor);
    			mount_component(icon1, pre1, null);
    			append_dev(pre1, t3);
    			append_dev(pre1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, pre2, anchor);
    			mount_component(icon2, pre2, null);
    			append_dev(pre2, t6);
    			append_dev(pre2, t7);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*data*/ 2) && t1_value !== (t1_value = JSON.stringify(JSON.parse(/*data*/ ctx[1].extra.request.postData.contents), null, 2) + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*data*/ 2) && t4_value !== (t4_value = JSON.stringify(/*data*/ ctx[1], null, 2) + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*data*/ 2) && t7_value !== (t7_value = /*data*/ ctx[1].extra.logs + "")) set_data_dev(t7, t7_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre0);
    			destroy_component(icon0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(pre1);
    			destroy_component(icon1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(pre2);
    			destroy_component(icon2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(92:0) {#if open}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let select;
    	let option;
    	let option_value_value;
    	let t1;
    	let button;
    	let t3;
    	let t4;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*tests*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block0 = /*retrieving*/ ctx[2] && create_if_block_1(ctx);
    	let if_block1 = /*open*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			select = element("select");
    			option = element("option");
    			option.textContent = "Select a test...";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			button = element("button");
    			button.textContent = "Go";
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			option.__value = option_value_value = {};
    			option.value = option.__value;
    			option.selected = true;
    			add_location(option, file$1, 82, 4, 2233);
    			attr_dev(select, "onchange", /*getData*/ ctx[5]);
    			if (/*request*/ ctx[3] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[6].call(select));
    			add_location(select, file$1, 81, 0, 2180);
    			add_location(button, file$1, 87, 0, 2396);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*request*/ ctx[3]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[6]),
    					listen_dev(button, "click", /*getData*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tests, JSON*/ 16) {
    				each_value = /*tests*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*request, tests*/ 24) {
    				select_option(select, /*request*/ ctx[3]);
    			}

    			if (/*retrieving*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(t4.parentNode, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*open*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*open*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t3);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function theParameters(params) {
    	if (typeof params == "object") return JSON.stringify(params);
    	return params;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let tests;
    	let $user;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(7, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Apitest", slots, []);
    	let open = false;
    	let data = [];
    	let retrieving = false;
    	let request = {};

    	async function getDataFromExpress() {
    		$$invalidate(2, retrieving = true);
    		$$invalidate(0, open = false);

    		// const { fn, params } = value;
    		const auth = `Bearer ${$user.jwt}`;

    		// log({ cookie });
    		// document.cookie = cookie;
    		const result = await fetch("/json?x=6&y=8&y=10", {
    			method: "GET",
    			headers: { Authorization: auth }
    		}).then(res => res.json());

    		$$invalidate(1, data = {
    			...result,
    			extra: {
    				logs: [],
    				request: { postData: { contents: "[\"Express\"]" } }
    			}
    		});

    		log({ data });
    		$$invalidate(2, retrieving = false);
    		$$invalidate(0, open = true);
    		return data;
    	}

    	async function getData() {
    		$$invalidate(2, retrieving = true);
    		$$invalidate(0, open = false);

    		// const { fn, params } = value;
    		$$invalidate(1, data = await server(...request));

    		//     .catch((e) => {
    		//     log(123, e);
    		//     return e;
    		// });
    		$$invalidate(2, retrieving = false);

    		$$invalidate(0, open = true);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Apitest> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		request = select_value(this);
    		$$invalidate(3, request);
    		$$invalidate(4, tests);
    	}

    	$$self.$capture_state = () => ({
    		server,
    		log,
    		Icon,
    		user,
    		open,
    		data,
    		retrieving,
    		request,
    		getDataFromExpress,
    		getData,
    		theParameters,
    		tests,
    		$user
    	});

    	$$self.$inject_state = $$props => {
    		if ("open" in $$props) $$invalidate(0, open = $$props.open);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    		if ("retrieving" in $$props) $$invalidate(2, retrieving = $$props.retrieving);
    		if ("request" in $$props) $$invalidate(3, request = $$props.request);
    		if ("tests" in $$props) $$invalidate(4, tests = $$props.tests);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(4, tests = [
    		["testData", "read"],
    		["testDataXXX", "read"],
    		["testData", "read", [1022]],
    		[
    			"testData",
    			"create",
    			[
    				{
    					string: "2||4||pat",
    					number: 123,
    					boolean: true,
    					array: [2, 5, "tim"],
    					object: {},
    					text: "multi\nline",
    					datetime: new Date(),
    					date: new Date("2019-12-28"),
    					time: new Date(0, 0, 0, 10, 0, 0)
    				}
    			]
    		],
    		[,"a"],
    		["", "login"],
    		[,"initializeMetaData"],
    		["", "invalidFunctionName"]
    	]);

    	return [open, data, retrieving, request, tests, getData, select_change_handler];
    }

    class Apitest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Apitest",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Google.svelte generated by Svelte v3.32.3 */

    const { console: console_1 } = globals;
    const file$2 = "src/Google.svelte";

    // (107:0) {#if $user.auth}
    function create_if_block$1(ctx) {
    	let button;
    	let t1;
    	let pre;
    	let t2_value = JSON.stringify(/*$user*/ ctx[0], null, 2) + "";
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Logoff...";
    			t1 = space();
    			pre = element("pre");
    			t2 = text(t2_value);
    			add_location(button, file$2, 107, 4, 3700);
    			add_location(pre, file$2, 108, 4, 3750);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", signOut, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$user*/ 1 && t2_value !== (t2_value = JSON.stringify(/*$user*/ ctx[0], null, 2) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(pre);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(107:0) {#if $user.auth}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*$user*/ ctx[0].auth && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$user*/ ctx[0].auth) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function signOut() {
    	gapi.auth2.getAuthInstance().signOut();
    	window.location.reload();
    }

    async function updateSigninStatus() {
    	const buildUser = ({ profile, googleUser }) => {
    		return {
    			photoUrl: profile.getImageUrl(),
    			displayName: profile.getName(),
    			firstName: profile.getGivenName(),
    			lastName: profile.getFamilyName(),
    			email: profile.getEmail(),
    			id: profile.getId(),
    			idToken: googleUser.getAuthResponse().id_token,
    			accessToken: googleUser.getAuthResponse().access_token,
    			hasGoogleAuth: true,
    			hasPinAuth: false,
    			hasFirebaseAuth: false,
    			signout: signOut
    		};
    	};

    	const getProfile = () => {
    		const googleAuth = gapi.auth2.getAuthInstance();
    		const googleUser = googleAuth.currentUser.get();
    		const profile = googleUser.getBasicProfile();
    		return { profile, googleUser };
    	};

    	let { profile } = getProfile();

    	while (!profile) {
    		await gapi.auth2.getAuthInstance().signIn();
    		profile = getProfile().profile;
    	}

    	return buildUser(getProfile());
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $user;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(0, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Google", slots, []);
    	const dispatch = createEventDispatcher();

    	onMount(async () => {
    		const gUser = await getUser().catch(() => window.location = "/");

    		// user.set({ ...$user, jwt: gUser.idToken });
    		// const response = await server({
    		//     fn: "login",
    		//     params: { idToken: gUser.idToken },
    		// });
    		// if (response.error) {
    		//     return;
    		// }
    		// user.set(response.value);
    		// updateActivePanel(homePanelId);
    		dispatch("gotUser", gUser);
    	});

    	const DISCOVERY_DOCS = [
    		"https://www.googleapis.com/discovery/v1/apis/people/v1/rest",
    		"https://sheets.googleapis.com/$discovery/rest?version=v4",
    		"https://script.googleapis.com/$discovery/rest?version=v1"
    	];

    	const scopesArray = [
    		"https://www.googleapis.com/auth/contacts.readonly",
    		"https://www.googleapis.com/auth/spreadsheets",
    		"https://www.googleapis.com/auth/script.send_mail",
    		"https://www.googleapis.com/auth/userinfo.email"
    	];

    	var SCOPES = " "; //scopesArray.join(' ')

    	const signIn = () => {
    		gapi.auth2.getAuthInstance().signIn().then(updateSigninStatus);
    	};

    	async function getUser() {
    		if (!window.gapi) {
    			await import('https://apis.google.com/js/platform.js');
    		}

    		return new Promise((resolve, reject) => {
    				window.gapi.load("client:auth2", () => initClient(resolve, reject));
    			});
    	}

    	async function initClient(resolve, reject) {
    		const options = {
    			apiKey: API_KEY,
    			clientId: CLIENT_ID,
    			discoveryDocs: DISCOVERY_DOCS,
    			scope: SCOPES,
    			fetch_basic_profile: true,
    			prompt: "select_account"
    		};

    		const user = await gapi.client.init(options).then(() => {
    			const user = updateSigninStatus().then(user => resolve(user)).catch(reject);
    		}).catch(e => console.log("Error in initClient", { e }));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Google> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		user,
    		noAuth,
    		server,
    		CLIENT_ID,
    		API_KEY,
    		Apitest,
    		dispatch,
    		DISCOVERY_DOCS,
    		scopesArray,
    		SCOPES,
    		signIn,
    		signOut,
    		getUser,
    		initClient,
    		updateSigninStatus,
    		$user
    	});

    	$$self.$inject_state = $$props => {
    		if ("SCOPES" in $$props) SCOPES = $$props.SCOPES;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$user];
    }

    class Google extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Google",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.32.3 */
    const file$3 = "src/App.svelte";

    // (20:23) <Icon>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("circle");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(20:23) <Icon>",
    		ctx
    	});

    	return block;
    }

    // (21:25) <Icon>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("open_in_new");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(21:25) <Icon>",
    		ctx
    	});

    	return block;
    }

    // (22:0) {#if !$user.auth}
    function create_if_block$2(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Checking Authentication...";
    			add_location(h1, file$3, 22, 1, 647);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(22:0) {#if !$user.auth}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let h1;
    	let t0;
    	let icon0;
    	let icon1;
    	let t1;
    	let span;
    	let icon2;
    	let t2;
    	let t3;
    	let google;
    	let t4;
    	let apitest;
    	let current;

    	icon0 = new Icon({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	icon1 = new Icon({ $$inline: true });

    	icon2 = new Icon({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = !/*$user*/ ctx[0].auth && create_if_block$2(ctx);
    	google = new Google({ $$inline: true });
    	google.$on("gotUser", /*gotUser*/ ctx[1]);
    	apitest = new Apitest({ $$inline: true });

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Svelte PWA Template");
    			create_component(icon0.$$.fragment);
    			create_component(icon1.$$.fragment);
    			t1 = space();
    			span = element("span");
    			create_component(icon2.$$.fragment);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			create_component(google.$$.fragment);
    			t4 = space();
    			create_component(apitest.$$.fragment);
    			add_location(h1, file$3, 19, 0, 515);
    			set_style(span, "color", "red");
    			add_location(span, file$3, 20, 0, 571);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			mount_component(icon0, h1, null);
    			mount_component(icon1, h1, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span, anchor);
    			mount_component(icon2, span, null);
    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(google, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(apitest, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const icon0_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				icon0_changes.$$scope = { dirty, ctx };
    			}

    			icon0.$set(icon0_changes);
    			const icon2_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				icon2_changes.$$scope = { dirty, ctx };
    			}

    			icon2.$set(icon2_changes);

    			if (!/*$user*/ ctx[0].auth) {
    				if (if_block) ; else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(t3.parentNode, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);
    			transition_in(google.$$.fragment, local);
    			transition_in(apitest.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			transition_out(google.$$.fragment, local);
    			transition_out(apitest.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span);
    			destroy_component(icon2);
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(google, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(apitest, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $user;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(0, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	function gotUser(event) {
    		const { detail: gUser } = event;
    		gUser.auth = true;
    		gUser.jwt = gUser.idToken;

    		gUser.timezone = {
    			simple: new Date().toTimeString().slice(9),
    			city: Intl.DateTimeFormat().resolvedOptions().timeZone,
    			offset: new Date().getTimezoneOffset() / -60
    		};

    		user.set(gUser);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Google,
    		user,
    		log,
    		Icon,
    		Apitest,
    		gotUser,
    		$user
    	});

    	return [$user, gotUser];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    // window.startApp = async () => {
    // 	getGoogleUser().then(startApp)
    // }
    // async function getGoogleUser () {
    // 	const gUser = await getUser().catch(() => (window.location = "/"));
    // 	console.log(gUser)
    // 	return gUser
    // user.set({ ...$user, jwt: gUser.idToken });
    // const response = await server({
    // 	fn: "login",
    // 	params: { idToken: gUser.idToken },
    // });
    // if (response.error) {
    // 	window.location = '/';
    // }
    // user.set(response.value);
    // updateActivePanel(homePanelId);
    // }

    // function startApp (gUser) {
    // gUser.timezone = {
    // 	simple: new Date().toTimeString().slice(9)
    // 	, city: Intl.DateTimeFormat().resolvedOptions().timeZone
    // 	, offset: new Date().getTimezoneOffset() / -60
    // }
    // user.set(gUser)
    // document.body.innerHTML = ''
    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    log( 'In Development');
    document.title = `${ 'Dev - '}${document.title}`;

    return app;

}());
//# sourceMappingURL=bundle.js.map
