
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function init_binding_group(group) {
        let _inputs;
        return {
            /* push */ p(...inputs) {
                _inputs = inputs;
                _inputs.forEach(input => group.push(input));
            },
            /* remove */ r() {
                _inputs.forEach(input => group.splice(group.indexOf(input), 1));
            }
        };
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
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
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
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
        else if (callback) {
            callback();
        }
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
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
            mount_component(component, options.target, options.anchor, options.customElement);
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
            if (!is_function(callback)) {
                return noop;
            }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
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

    const API_PATH = 'https://namespinner.art.art/api/v1/';
    const TOKEN = 'eyJhbGciOiJIUzUxMiIsImp0aSI6IjE5YzE1NzUwLTI0NmMtNDc1NC1hOTJlLTY0MTBhODMyODUzOSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxOWMxNTc1MC0yNDZjLTQ3NTQtYTkyZS02NDEwYTgzMjg1MzkiLCJpYXQiOjE2NjIxMDYyODYsIm5iZiI6MTY2MjEwNjI4NiwiYXVkIjoiMmUwNTQyNDYtNjFlMC00Njg0LWFkNGItYTZiMmE0MzkxMzQ0In0.Gb55DWTone2_DavCxEHtEEhdiu6xamrq41CKxmFnsjpkLnu7FzMhz2aUmLfYpNg3xPyI1QifZ3efDglLw7ss1g';

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const domainsStore = writable([]);
    const setDomains = (newDomains) => {
        domainsStore.set(newDomains);
    };

    const suggestionsTypeStore = writable('');
    const setSuggestionsType = (newSuggestionsType) => {
        suggestionsTypeStore.set(newSuggestionsType);
    };

    const suggestionsStore = writable([]);
    const addSuggestions = (newSuggestions) => {
        suggestionsStore.update(existingSuggestions => [...existingSuggestions, ...newSuggestions]);
    };

    const filtersStore = writable({});
    const setFiltersStore = (newFilters) => {
        filtersStore.set(newFilters);
    };

    const searchNamesStore = writable('');
    const setSearchNamesStore = (newSearchNames) => {
        searchNamesStore.set(newSearchNames);
    };

    const suggestionsDomain = async (domain, searchType, filters) => {
        let endpoint = '';

        switch (searchType) {
            case 'default':
                endpoint = `${API_PATH}domains/suggestions?domain=${domain}&limit=20&offset=0`;
                break;
            case 'ai':
                endpoint = `${API_PATH}ai/suggestions?prompt=${domain}&limit=10`;
                break;
            case 'premium':
                const {
                    nameMatch,
                    available,
                    reserved,
                    referral,
                    limitRange,
                    offsetRange,
                } = filters;
                console.log(filters);
                endpoint = `${API_PATH}domains/premiums?name=${domain}&nameMatch=${nameMatch}&priceMin=9.95&priceMax=9.95&symbolsMin=1&symbolsMax=10&available=${available}&reserved=${reserved}&referral=${referral}&limit=${limitRange}&offset=${offsetRange}`;
                break;
            default:
                console.error('Invalid searchType:', searchType);
                return;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': 'en',
                    'Authorization': `Bearer ${TOKEN}`
                },
            });

            if (response.ok) {
                const data = await response.json();
                const newSuggestions = data?._embedded?.items || [];

                addSuggestions(newSuggestions);
            } else {
                console.error('Ошибка при выполнении запроса:', response.statusText);
            }
        } catch (error) {
            console.error('Ошибка при выполнении запроса:', error.message);
        }
    };

    const checkDomains = async (searchValue, searchType) => {
        const domains = searchValue.split(/[\s,]+/);
        const domainsQuery = domains.map((domain) => `${domain}.art`);

        try {
            const response = await fetch(`${API_PATH}domains/check?${domainsQuery.map(domain => `domains[]=${domain}`).join('&')}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept-Language': 'en',
                    'Authorization': `Bearer ${TOKEN}`
                },
            });

            if (response.ok) {
                const data = await response.json();
                const newDomains = data?._embedded?.items || [];

                setDomains(newDomains);

                for (const domain of domainsQuery) {
                    await suggestionsDomain(domain, searchType);
                }
            } else {
                console.error('Ошибка при выполнении запроса:', response.statusText);
            }
        } catch (error) {
            console.error('Ошибка при выполнении запроса:', error.message);
        }
    };

    function pxToEm(pxValue) {
        const bodyFontSize = getComputedStyle(document.body).fontSize;
        const emValue = (pxValue * 10) /  parseFloat(bodyFontSize);

        return emValue;
    }

    function css(node, properties) {
        const setProps = (props) => {
            Object.keys(props).forEach((prop) => (node.style[prop] = props[prop]));
        };
        setProps(properties);
        return {
            update: setProps,
        };
    }

    // example:
    //      use:css={{fontSize: `${pxToEm(value)}em`}}

    /* src\components\Header\Header.svelte generated by Svelte v3.59.2 */
    const file$6 = "src\\components\\Header\\Header.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let form;
    	let input0;
    	let t0;
    	let button;
    	let t2;
    	let div;
    	let label0;
    	let input1;
    	let t3;
    	let t4;
    	let label1;
    	let input2;
    	let t5;
    	let t6;
    	let label2;
    	let input3;
    	let t7;
    	let binding_group;
    	let mounted;
    	let dispose;
    	binding_group = init_binding_group(/*$$binding_groups*/ ctx[5][0]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			form = element("form");
    			input0 = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Search Domains";
    			t2 = space();
    			div = element("div");
    			label0 = element("label");
    			input1 = element("input");
    			t3 = text("\r\n            🌐 Default");
    			t4 = space();
    			label1 = element("label");
    			input2 = element("input");
    			t5 = text("\r\n            🧠 AI help");
    			t6 = space();
    			label2 = element("label");
    			input3 = element("input");
    			t7 = text("\r\n            💎 onlyPrems");
    			attr_dev(input0, "class", "search-input svelte-pbki8a");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Find your domain");
    			add_location(input0, file$6, 27, 8, 939);
    			attr_dev(button, "class", "search-button svelte-pbki8a");
    			attr_dev(button, "type", "submit");
    			add_location(button, file$6, 39, 8, 1410);
    			attr_dev(form, "class", "search-form svelte-pbki8a");
    			add_location(form, file$6, 26, 4, 863);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "id", "default");
    			input1.__value = "default";
    			input1.value = input1.__value;
    			attr_dev(input1, "class", "svelte-pbki8a");
    			add_location(input1, file$6, 63, 12, 2153);
    			attr_dev(label0, "for", "default");
    			attr_dev(label0, "class", "svelte-pbki8a");
    			toggle_class(label0, "active", /*searchType*/ ctx[1] === 'default');
    			add_location(label0, file$6, 59, 8, 2034);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "id", "ai");
    			input2.__value = "ai";
    			input2.value = input2.__value;
    			attr_dev(input2, "class", "svelte-pbki8a");
    			add_location(input2, file$6, 70, 12, 2387);
    			attr_dev(label1, "for", "ai");
    			attr_dev(label1, "class", "svelte-pbki8a");
    			toggle_class(label1, "active", /*searchType*/ ctx[1] === 'ai');
    			add_location(label1, file$6, 66, 8, 2278);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "id", "premium");
    			input3.__value = "premium";
    			input3.value = input3.__value;
    			attr_dev(input3, "class", "svelte-pbki8a");
    			add_location(input3, file$6, 77, 12, 2621);
    			attr_dev(label2, "for", "premium");
    			attr_dev(label2, "class", "svelte-pbki8a");
    			toggle_class(label2, "active", /*searchType*/ ctx[1] === 'premium');
    			add_location(label2, file$6, 73, 8, 2502);
    			attr_dev(div, "class", "tab-container svelte-pbki8a");
    			add_location(div, file$6, 52, 4, 1852);
    			attr_dev(main, "class", "search-form-container svelte-pbki8a");
    			add_location(main, file$6, 16, 0, 516);
    			binding_group.p(input1, input2, input3);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, form);
    			append_dev(form, input0);
    			set_input_value(input0, /*searchValue*/ ctx[0]);
    			append_dev(form, t0);
    			append_dev(form, button);
    			append_dev(main, t2);
    			append_dev(main, div);
    			append_dev(div, label0);
    			append_dev(label0, input1);
    			input1.checked = input1.__value === /*searchType*/ ctx[1];
    			append_dev(label0, t3);
    			append_dev(div, t4);
    			append_dev(div, label1);
    			append_dev(label1, input2);
    			input2.checked = input2.__value === /*searchType*/ ctx[1];
    			append_dev(label1, t5);
    			append_dev(div, t6);
    			append_dev(div, label2);
    			append_dev(label2, input3);
    			input3.checked = input3.__value === /*searchType*/ ctx[1];
    			append_dev(label2, t7);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(css.call(null, input0, {
    						padding: `${pxToEm(60)}em`,
    						border: `${pxToEm(1)}em solid #dddddd`,
    						'border-radius': `${pxToEm(30)}em 0 0 ${pxToEm(30)}em`,
    						'font-size': `${pxToEm(16)}em`
    					})),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					action_destroyer(css.call(null, button, {
    						padding: `${pxToEm(60)}em`,
    						border: `${pxToEm(1)}em solid #1e90ff`,
    						'border-radius': `0 ${pxToEm(30)}em ${pxToEm(30)}em 0`,
    						'font-size': `${pxToEm(16)}em`
    					})),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[2]), false, true, false, false),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[4]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[6]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[7]),
    					action_destroyer(css.call(null, div, {
    						left: `${pxToEm(30)}em`,
    						bottom: `${pxToEm(-38)}em`
    					})),
    					action_destroyer(css.call(null, main, {
    						padding: `${pxToEm(30)}em`,
    						border: `${pxToEm(1)}em solid #dddddd`,
    						'border-radius': `${pxToEm(8)}em`,
    						'box-shadow': `0 ${pxToEm(4)}em ${pxToEm(8)}em rgba(0, 0, 0, 0.1)`,
    						margin: `${pxToEm(60)}em`
    					}))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchValue*/ 1 && input0.value !== /*searchValue*/ ctx[0]) {
    				set_input_value(input0, /*searchValue*/ ctx[0]);
    			}

    			if (dirty & /*searchType*/ 2) {
    				input1.checked = input1.__value === /*searchType*/ ctx[1];
    			}

    			if (dirty & /*searchType*/ 2) {
    				toggle_class(label0, "active", /*searchType*/ ctx[1] === 'default');
    			}

    			if (dirty & /*searchType*/ 2) {
    				input2.checked = input2.__value === /*searchType*/ ctx[1];
    			}

    			if (dirty & /*searchType*/ 2) {
    				toggle_class(label1, "active", /*searchType*/ ctx[1] === 'ai');
    			}

    			if (dirty & /*searchType*/ 2) {
    				input3.checked = input3.__value === /*searchType*/ ctx[1];
    			}

    			if (dirty & /*searchType*/ 2) {
    				toggle_class(label2, "active", /*searchType*/ ctx[1] === 'premium');
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			binding_group.r();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	let searchValue = '123, test art, love';
    	let searchType = 'default';

    	const handleSubmit = () => {
    		searchValue.length && checkDomains(searchValue, searchType);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input0_input_handler() {
    		searchValue = this.value;
    		$$invalidate(0, searchValue);
    	}

    	function input1_change_handler() {
    		searchType = this.__value;
    		$$invalidate(1, searchType);
    	}

    	function input2_change_handler() {
    		searchType = this.__value;
    		$$invalidate(1, searchType);
    	}

    	function input3_change_handler() {
    		searchType = this.__value;
    		$$invalidate(1, searchType);
    	}

    	$$self.$capture_state = () => ({
    		checkDomains,
    		pxToEm,
    		css,
    		setSearchNamesStore,
    		setSuggestionsType,
    		searchValue,
    		searchType,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ('searchValue' in $$props) $$invalidate(0, searchValue = $$props.searchValue);
    		if ('searchType' in $$props) $$invalidate(1, searchType = $$props.searchType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*searchType*/ 2) {
    			setSuggestionsType(searchType);
    		}

    		if ($$self.$$.dirty & /*searchValue*/ 1) {
    			setSearchNamesStore(searchValue);
    		}
    	};

    	return [
    		searchValue,
    		searchType,
    		handleSubmit,
    		input0_input_handler,
    		input1_change_handler,
    		$$binding_groups,
    		input2_change_handler,
    		input3_change_handler
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\Card\Card.svelte generated by Svelte v3.59.2 */
    const file$5 = "src\\components\\Card\\Card.svelte";

    // (19:8) {#if item.premium}
    function create_if_block_2$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Premium Domain";
    			attr_dev(p, "class", "premium tag svelte-jionjk");
    			add_location(p, file$5, 19, 12, 538);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(19:8) {#if item.premium}",
    		ctx
    	});

    	return block;
    }

    // (22:8) {#if item.reserved}
    function create_if_block_1$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Reserved";
    			attr_dev(p, "class", "reserved tag svelte-jionjk");
    			add_location(p, file$5, 22, 12, 637);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(22:8) {#if item.reserved}",
    		ctx
    	});

    	return block;
    }

    // (25:8) {#if item.bought}
    function create_if_block$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Bought";
    			attr_dev(p, "class", "bought tag svelte-jionjk");
    			add_location(p, file$5, 25, 12, 729);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(25:8) {#if item.bought}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let h2;
    	let t3_value = /*item*/ ctx[0].name + "";
    	let t3;
    	let t4;
    	let p0;
    	let t5;
    	let t6_value = /*item*/ ctx[0].price + "";
    	let t6;
    	let p0_class_value;
    	let t7;
    	let p1;
    	let t8_value = (/*item*/ ctx[0].available ? 'Available' : 'Unavailable') + "";
    	let t8;
    	let p1_class_value;
    	let mounted;
    	let dispose;
    	let if_block0 = /*item*/ ctx[0].premium && create_if_block_2$2(ctx);
    	let if_block1 = /*item*/ ctx[0].reserved && create_if_block_1$2(ctx);
    	let if_block2 = /*item*/ ctx[0].bought && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(t3_value);
    			t4 = space();
    			p0 = element("p");
    			t5 = text("$");
    			t6 = text(t6_value);
    			t7 = space();
    			p1 = element("p");
    			t8 = text(t8_value);
    			add_location(div0, file$5, 17, 4, 491);
    			attr_dev(h2, "class", "card-title svelte-jionjk");
    			add_location(h2, file$5, 29, 4, 796);
    			attr_dev(p0, "class", p0_class_value = "" + (null_to_empty(/*item*/ ctx[0].premium ? 'premium' : 'standard') + " svelte-jionjk"));
    			add_location(p0, file$5, 37, 4, 964);
    			attr_dev(p1, "class", p1_class_value = "" + (null_to_empty(/*item*/ ctx[0].available ? 'available' : 'unavailable') + " svelte-jionjk"));
    			add_location(p1, file$5, 38, 4, 1038);
    			attr_dev(div1, "class", "domain-card svelte-jionjk");
    			add_location(div1, file$5, 7, 0, 106);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div0, t1);
    			if (if_block2) if_block2.m(div0, null);
    			append_dev(div1, t2);
    			append_dev(div1, h2);
    			append_dev(h2, t3);
    			append_dev(div1, t4);
    			append_dev(div1, p0);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(div1, t7);
    			append_dev(div1, p1);
    			append_dev(p1, t8);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(css.call(null, h2, { 'font-size': `${pxToEm(45)}em` })),
    					action_destroyer(css.call(null, div1, {
    						border: `${pxToEm(1)}em solid #dddddd`,
    						'border-radius': `${pxToEm(8)}em`,
    						padding: `${pxToEm(30)}em ${pxToEm(30)}em ${pxToEm(30)}em ${pxToEm(60)}em`,
    						margin: `${pxToEm(30)}em`,
    						'box-shadow': `0 ${pxToEm(4)}em ${pxToEm(8)}em rgba(0, 0, 0, 0.1)`
    					}))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*item*/ ctx[0].premium) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*item*/ ctx[0].reserved) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					if_block1.m(div0, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*item*/ ctx[0].bought) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block$3(ctx);
    					if_block2.c();
    					if_block2.m(div0, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*item*/ 1 && t3_value !== (t3_value = /*item*/ ctx[0].name + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*item*/ 1 && t6_value !== (t6_value = /*item*/ ctx[0].price + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*item*/ 1 && p0_class_value !== (p0_class_value = "" + (null_to_empty(/*item*/ ctx[0].premium ? 'premium' : 'standard') + " svelte-jionjk"))) {
    				attr_dev(p0, "class", p0_class_value);
    			}

    			if (dirty & /*item*/ 1 && t8_value !== (t8_value = (/*item*/ ctx[0].available ? 'Available' : 'Unavailable') + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*item*/ 1 && p1_class_value !== (p1_class_value = "" + (null_to_empty(/*item*/ ctx[0].available ? 'available' : 'unavailable') + " svelte-jionjk"))) {
    				attr_dev(p1, "class", p1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, []);
    	let { item } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (item === undefined && !('item' in $$props || $$self.$$.bound[$$self.$$.props['item']])) {
    			console.warn("<Card> was created without expected prop 'item'");
    		}
    	});

    	const writable_props = ['item'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ pxToEm, css, item });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get item() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Card\CardContainer.svelte generated by Svelte v3.59.2 */
    const file$4 = "src\\components\\Card\\CardContainer.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (23:4) {#each itemsArray as item (item.id + item.name)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let card;
    	let current;

    	card = new Card({
    			props: { class: "card", item: /*item*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(card.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const card_changes = {};
    			if (dirty & /*itemsArray*/ 1) card_changes.item = /*item*/ ctx[2];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(23:4) {#each itemsArray as item (item.id + item.name)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*itemsArray*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[2].id + /*item*/ ctx[2].name;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "card-container svelte-1db69d5");
    			add_location(div, file$4, 18, 0, 424);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(css.call(null, div, { margin: `0 ${pxToEm(30)}em` }));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*itemsArray*/ 1) {
    				each_value = /*itemsArray*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CardContainer', slots, []);
    	let { itemsArray = [] } = $$props;

    	const unsubscribeDomainsStore = domainsStore.subscribe(items => {
    		$$invalidate(0, itemsArray = items);
    	});

    	onDestroy(() => {
    		unsubscribeDomainsStore();
    	});

    	const writable_props = ['itemsArray'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CardContainer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('itemsArray' in $$props) $$invalidate(0, itemsArray = $$props.itemsArray);
    	};

    	$$self.$capture_state = () => ({
    		domainsStore,
    		onDestroy,
    		Card,
    		pxToEm,
    		css,
    		itemsArray,
    		unsubscribeDomainsStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('itemsArray' in $$props) $$invalidate(0, itemsArray = $$props.itemsArray);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [itemsArray];
    }

    class CardContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { itemsArray: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CardContainer",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get itemsArray() {
    		throw new Error("<CardContainer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemsArray(value) {
    		throw new Error("<CardContainer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\DomainCardDetails\DomainCardDetails.svelte generated by Svelte v3.59.2 */

    const file$3 = "src\\components\\DomainCardDetails\\DomainCardDetails.svelte";

    // (7:8) {#if selectedDomain.premium}
    function create_if_block_2$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Premium Domain";
    			attr_dev(p, "class", "premium tag svelte-ha8zth");
    			add_location(p, file$3, 7, 12, 143);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(7:8) {#if selectedDomain.premium}",
    		ctx
    	});

    	return block;
    }

    // (10:8) {#if selectedDomain.reserved}
    function create_if_block_1$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Reserved";
    			attr_dev(p, "class", "reserved tag svelte-ha8zth");
    			add_location(p, file$3, 10, 12, 252);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(10:8) {#if selectedDomain.reserved}",
    		ctx
    	});

    	return block;
    }

    // (13:8) {#if selectedDomain.bought}
    function create_if_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Bought";
    			attr_dev(p, "class", "bought tag svelte-ha8zth");
    			add_location(p, file$3, 13, 12, 354);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(13:8) {#if selectedDomain.bought}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let h2;
    	let t3_value = /*selectedDomain*/ ctx[0].name + "";
    	let t3;
    	let t4;
    	let p0;
    	let t5;
    	let t6_value = /*selectedDomain*/ ctx[0].price + "";
    	let t6;
    	let p0_class_value;
    	let t7;
    	let p1;

    	let t8_value = (/*selectedDomain*/ ctx[0].available
    	? 'Available'
    	: 'Unavailable') + "";

    	let t8;
    	let p1_class_value;
    	let if_block0 = /*selectedDomain*/ ctx[0].premium && create_if_block_2$1(ctx);
    	let if_block1 = /*selectedDomain*/ ctx[0].reserved && create_if_block_1$1(ctx);
    	let if_block2 = /*selectedDomain*/ ctx[0].bought && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(t3_value);
    			t4 = space();
    			p0 = element("p");
    			t5 = text("$");
    			t6 = text(t6_value);
    			t7 = space();
    			p1 = element("p");
    			t8 = text(t8_value);
    			add_location(div0, file$3, 5, 4, 86);
    			attr_dev(h2, "class", "card-title svelte-ha8zth");
    			add_location(h2, file$3, 17, 4, 421);

    			attr_dev(p0, "class", p0_class_value = "" + ((/*selectedDomain*/ ctx[0].premium
    			? 'price__premium'
    			: 'price__standard') + " price" + " svelte-ha8zth"));

    			add_location(p0, file$3, 18, 4, 476);

    			attr_dev(p1, "class", p1_class_value = "" + (null_to_empty(/*selectedDomain*/ ctx[0].available
    			? 'available'
    			: 'unavailable') + " svelte-ha8zth"));

    			add_location(p1, file$3, 19, 4, 590);
    			attr_dev(div1, "class", "domain-card svelte-ha8zth");
    			add_location(div1, file$3, 4, 0, 55);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div0, t1);
    			if (if_block2) if_block2.m(div0, null);
    			append_dev(div1, t2);
    			append_dev(div1, h2);
    			append_dev(h2, t3);
    			append_dev(div1, t4);
    			append_dev(div1, p0);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(div1, t7);
    			append_dev(div1, p1);
    			append_dev(p1, t8);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*selectedDomain*/ ctx[0].premium) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*selectedDomain*/ ctx[0].reserved) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(div0, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*selectedDomain*/ ctx[0].bought) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block$2(ctx);
    					if_block2.c();
    					if_block2.m(div0, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*selectedDomain*/ 1 && t3_value !== (t3_value = /*selectedDomain*/ ctx[0].name + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*selectedDomain*/ 1 && t6_value !== (t6_value = /*selectedDomain*/ ctx[0].price + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*selectedDomain*/ 1 && p0_class_value !== (p0_class_value = "" + ((/*selectedDomain*/ ctx[0].premium
    			? 'price__premium'
    			: 'price__standard') + " price" + " svelte-ha8zth"))) {
    				attr_dev(p0, "class", p0_class_value);
    			}

    			if (dirty & /*selectedDomain*/ 1 && t8_value !== (t8_value = (/*selectedDomain*/ ctx[0].available
    			? 'Available'
    			: 'Unavailable') + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*selectedDomain*/ 1 && p1_class_value !== (p1_class_value = "" + (null_to_empty(/*selectedDomain*/ ctx[0].available
    			? 'available'
    			: 'unavailable') + " svelte-ha8zth"))) {
    				attr_dev(p1, "class", p1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DomainCardDetails', slots, []);
    	let { selectedDomain } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (selectedDomain === undefined && !('selectedDomain' in $$props || $$self.$$.bound[$$self.$$.props['selectedDomain']])) {
    			console.warn("<DomainCardDetails> was created without expected prop 'selectedDomain'");
    		}
    	});

    	const writable_props = ['selectedDomain'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DomainCardDetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('selectedDomain' in $$props) $$invalidate(0, selectedDomain = $$props.selectedDomain);
    	};

    	$$self.$capture_state = () => ({ selectedDomain });

    	$$self.$inject_state = $$props => {
    		if ('selectedDomain' in $$props) $$invalidate(0, selectedDomain = $$props.selectedDomain);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedDomain];
    }

    class DomainCardDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { selectedDomain: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DomainCardDetails",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get selectedDomain() {
    		throw new Error("<DomainCardDetails>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedDomain(value) {
    		throw new Error("<DomainCardDetails>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\AdditionalDomainsList\AdditionalDomainsList.svelte generated by Svelte v3.59.2 */
    const file$2 = "src\\components\\AdditionalDomainsList\\AdditionalDomainsList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (59:4) {:else}
    function create_else_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No domains to display";
    			attr_dev(p, "class", "svelte-1wx1nat");
    			add_location(p, file$2, 59, 8, 2155);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(59:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:4) {#if domainsList.length > 0}
    function create_if_block$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*domainsList*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*domain*/ ctx[5].name;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*domainsList, selectedDomainIndex, pxToEm, handleOnMoreClick*/ 7) {
    				each_value = /*domainsList*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(27:4) {#if domainsList.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (29:12) {#if domain.price !== null && domain.available}
    function create_if_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*selectedDomainIndex*/ ctx[1] === /*index*/ ctx[7]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(29:12) {#if domain.price !== null && domain.available}",
    		ctx
    	});

    	return block;
    }

    // (32:16) {:else}
    function create_else_block(ctx) {
    	let div1;
    	let t0;
    	let t1;
    	let t2;
    	let div0;
    	let h20;
    	let t3_value = /*domain*/ ctx[5].name + "";
    	let t3;
    	let t4;
    	let h21;
    	let t5;
    	let t6_value = /*domain*/ ctx[5].price + "";
    	let t6;
    	let t7;
    	let mounted;
    	let dispose;
    	let if_block0 = /*domain*/ ctx[5].premium && create_if_block_5(ctx);
    	let if_block1 = /*domain*/ ctx[5].reserved && create_if_block_4(ctx);
    	let if_block2 = /*domain*/ ctx[5].bought && create_if_block_3(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*index*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			div0 = element("div");
    			h20 = element("h2");
    			t3 = text(t3_value);
    			t4 = space();
    			h21 = element("h2");
    			t5 = text("$");
    			t6 = text(t6_value);
    			t7 = space();
    			attr_dev(h20, "class", "domain-title svelte-1wx1nat");
    			add_location(h20, file$2, 51, 28, 1895);
    			attr_dev(h21, "class", "domain-price svelte-1wx1nat");
    			add_location(h21, file$2, 52, 28, 1968);
    			attr_dev(div0, "class", "domain-info svelte-1wx1nat");
    			add_location(div0, file$2, 50, 24, 1840);
    			attr_dev(div1, "class", "domain-item svelte-1wx1nat");
    			add_location(div1, file$2, 32, 20, 961);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, h20);
    			append_dev(h20, t3);
    			append_dev(div0, t4);
    			append_dev(div0, h21);
    			append_dev(h21, t5);
    			append_dev(h21, t6);
    			append_dev(div1, t7);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(css.call(null, div1, {
    						border: `${pxToEm(1)}em solid #dddddd`,
    						'box-shadow': `0 ${pxToEm(4)}em ${pxToEm(8)}em rgba(0, 0, 0, 0.1)`
    					})),
    					listen_dev(div1, "click", click_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*domain*/ ctx[5].premium) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*domain*/ ctx[5].reserved) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*domain*/ ctx[5].bought) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_3(ctx);
    					if_block2.c();
    					if_block2.m(div1, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*domainsList*/ 1 && t3_value !== (t3_value = /*domain*/ ctx[5].name + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*domainsList*/ 1 && t6_value !== (t6_value = /*domain*/ ctx[5].price + "")) set_data_dev(t6, t6_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(32:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (30:16) {#if selectedDomainIndex === index}
    function create_if_block_2(ctx) {
    	let domaincarddetails;
    	let current;

    	domaincarddetails = new DomainCardDetails({
    			props: { selectedDomain: /*domain*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(domaincarddetails.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(domaincarddetails, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const domaincarddetails_changes = {};
    			if (dirty & /*domainsList*/ 1) domaincarddetails_changes.selectedDomain = /*domain*/ ctx[5];
    			domaincarddetails.$set(domaincarddetails_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(domaincarddetails.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(domaincarddetails.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(domaincarddetails, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(30:16) {#if selectedDomainIndex === index}",
    		ctx
    	});

    	return block;
    }

    // (41:28) {#if domain.premium}
    function create_if_block_5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Premium";
    			attr_dev(p, "class", "premium tag svelte-1wx1nat");
    			add_location(p, file$2, 41, 32, 1437);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(41:28) {#if domain.premium}",
    		ctx
    	});

    	return block;
    }

    // (44:28) {#if domain.reserved}
    function create_if_block_4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Reserved";
    			attr_dev(p, "class", "reserved tag svelte-1wx1nat");
    			add_location(p, file$2, 44, 32, 1591);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(44:28) {#if domain.reserved}",
    		ctx
    	});

    	return block;
    }

    // (47:28) {#if domain.bought}
    function create_if_block_3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Bought";
    			attr_dev(p, "class", "bought tag svelte-1wx1nat");
    			add_location(p, file$2, 47, 32, 1745);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(47:28) {#if domain.bought}",
    		ctx
    	});

    	return block;
    }

    // (28:8) {#each domainsList as domain, index (domain.name)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = /*domain*/ ctx[5].price !== null && /*domain*/ ctx[5].available && create_if_block_1(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*domain*/ ctx[5].price !== null && /*domain*/ ctx[5].available) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*domainsList*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(28:8) {#each domainsList as domain, index (domain.name)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*domainsList*/ ctx[0].length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "domain-list svelte-1wx1nat");
    			add_location(div, file$2, 25, 0, 614);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AdditionalDomainsList', slots, []);
    	let { domainsList = [] } = $$props;
    	let selectedDomainIndex = null;

    	const unsubscribeSuggestionsStore = suggestionsStore.subscribe(items => {
    		$$invalidate(0, domainsList = items);
    	});

    	onDestroy(() => {
    		unsubscribeSuggestionsStore();
    	});

    	function handleOnMoreClick(index) {
    		$$invalidate(1, selectedDomainIndex = index);
    	}

    	const writable_props = ['domainsList'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AdditionalDomainsList> was created with unknown prop '${key}'`);
    	});

    	const click_handler = index => handleOnMoreClick(index);

    	$$self.$$set = $$props => {
    		if ('domainsList' in $$props) $$invalidate(0, domainsList = $$props.domainsList);
    	};

    	$$self.$capture_state = () => ({
    		suggestionsStore,
    		onDestroy,
    		DomainCardDetails,
    		pxToEm,
    		css,
    		domainsList,
    		selectedDomainIndex,
    		unsubscribeSuggestionsStore,
    		handleOnMoreClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('domainsList' in $$props) $$invalidate(0, domainsList = $$props.domainsList);
    		if ('selectedDomainIndex' in $$props) $$invalidate(1, selectedDomainIndex = $$props.selectedDomainIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [domainsList, selectedDomainIndex, handleOnMoreClick, click_handler];
    }

    class AdditionalDomainsList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { domainsList: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AdditionalDomainsList",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get domainsList() {
    		throw new Error("<AdditionalDomainsList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set domainsList(value) {
    		throw new Error("<AdditionalDomainsList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Header\components\Filters.svelte generated by Svelte v3.59.2 */
    const file$1 = "src\\components\\Header\\components\\Filters.svelte";

    function create_fragment$1(ctx) {
    	let div12;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let label0;
    	let input0;
    	let t2;
    	let t3;
    	let label1;
    	let input1;
    	let t4;
    	let t5;
    	let label2;
    	let input2;
    	let t6;
    	let t7;
    	let div4;
    	let label3;
    	let t9;
    	let div3;
    	let input3;
    	let t10;
    	let div6;
    	let label4;
    	let t12;
    	let div5;
    	let input4;
    	let t13;
    	let div8;
    	let label5;
    	let t15;
    	let div7;
    	let input5;
    	let t16;
    	let div9;
    	let label6;
    	let t17;
    	let t18;
    	let t19;
    	let input6;
    	let t20;
    	let div10;
    	let label7;
    	let t21;
    	let t22;
    	let t23;
    	let input7;
    	let t24;
    	let div11;
    	let button;
    	let binding_group;
    	let mounted;
    	let dispose;
    	binding_group = init_binding_group(/*$$binding_groups*/ ctx[9][0]);

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Name Match:";
    			t1 = space();
    			div1 = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t2 = text("\r\n                Partial");
    			t3 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t4 = text("\r\n                Start");
    			t5 = space();
    			label2 = element("label");
    			input2 = element("input");
    			t6 = text("\r\n                End");
    			t7 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Available";
    			t9 = space();
    			div3 = element("div");
    			input3 = element("input");
    			t10 = space();
    			div6 = element("div");
    			label4 = element("label");
    			label4.textContent = "Reserved";
    			t12 = space();
    			div5 = element("div");
    			input4 = element("input");
    			t13 = space();
    			div8 = element("div");
    			label5 = element("label");
    			label5.textContent = "Referral";
    			t15 = space();
    			div7 = element("div");
    			input5 = element("input");
    			t16 = space();
    			div9 = element("div");
    			label6 = element("label");
    			t17 = text("Limit: ");
    			t18 = text(/*limitRange*/ ctx[4]);
    			t19 = space();
    			input6 = element("input");
    			t20 = space();
    			div10 = element("div");
    			label7 = element("label");
    			t21 = text("Limit: ");
    			t22 = text(/*offsetRange*/ ctx[5]);
    			t23 = space();
    			input7 = element("input");
    			t24 = space();
    			div11 = element("div");
    			button = element("button");
    			button.textContent = "Apply Filters";
    			attr_dev(div0, "class", "filter-name svelte-ly0o17");
    			add_location(div0, file$1, 38, 8, 1001);
    			attr_dev(input0, "type", "radio");
    			input0.__value = "partial";
    			input0.value = input0.__value;
    			add_location(input0, file$1, 44, 16, 1145);
    			add_location(label0, file$1, 43, 12, 1120);
    			attr_dev(input1, "type", "radio");
    			input1.__value = "start";
    			input1.value = input1.__value;
    			add_location(input1, file$1, 48, 16, 1292);
    			add_location(label1, file$1, 47, 12, 1267);
    			attr_dev(input2, "type", "radio");
    			input2.__value = "end";
    			input2.value = input2.__value;
    			add_location(input2, file$1, 52, 16, 1435);
    			add_location(label2, file$1, 51, 12, 1410);
    			attr_dev(div1, "class", "filter-choice svelte-ly0o17");
    			add_location(div1, file$1, 42, 8, 1079);
    			attr_dev(div2, "class", "flex svelte-ly0o17");
    			add_location(div2, file$1, 37, 4, 973);
    			attr_dev(label3, "for", "available");
    			attr_dev(label3, "class", "filter-name svelte-ly0o17");
    			add_location(label3, file$1, 59, 8, 1599);
    			attr_dev(input3, "id", "available");
    			attr_dev(input3, "type", "checkbox");
    			add_location(input3, file$1, 63, 12, 1736);
    			attr_dev(div3, "class", "filter-choice svelte-ly0o17");
    			add_location(div3, file$1, 62, 8, 1694);
    			attr_dev(div4, "class", "flex svelte-ly0o17");
    			add_location(div4, file$1, 58, 4, 1571);
    			attr_dev(label4, "class", "filter-name svelte-ly0o17");
    			attr_dev(label4, "for", "reserved");
    			add_location(label4, file$1, 68, 8, 1865);
    			attr_dev(input4, "type", "checkbox");
    			attr_dev(input4, "id", "reserved");
    			add_location(input4, file$1, 72, 12, 1999);
    			attr_dev(div5, "class", "filter-choice svelte-ly0o17");
    			add_location(div5, file$1, 71, 8, 1957);
    			attr_dev(div6, "class", "flex svelte-ly0o17");
    			add_location(div6, file$1, 67, 4, 1837);
    			attr_dev(label5, "for", "referral");
    			attr_dev(label5, "class", "filter-name svelte-ly0o17");
    			add_location(label5, file$1, 77, 8, 2126);
    			attr_dev(input5, "type", "checkbox");
    			attr_dev(input5, "id", "referral");
    			add_location(input5, file$1, 81, 12, 2260);
    			attr_dev(div7, "class", "filter-choice svelte-ly0o17");
    			add_location(div7, file$1, 80, 8, 2218);
    			attr_dev(div8, "class", "flex svelte-ly0o17");
    			add_location(div8, file$1, 76, 4, 2098);
    			attr_dev(label6, "for", "limitRange");
    			add_location(label6, file$1, 86, 8, 2375);
    			attr_dev(input6, "type", "range");
    			attr_dev(input6, "id", "limitRange");
    			attr_dev(input6, "min", 0);
    			attr_dev(input6, "max", 20);
    			add_location(input6, file$1, 89, 12, 2464);
    			add_location(div9, file$1, 85, 4, 2359);
    			attr_dev(label7, "for", "offsetRange");
    			add_location(label7, file$1, 98, 8, 2712);
    			attr_dev(input7, "type", "range");
    			attr_dev(input7, "id", "offsetRange");
    			attr_dev(input7, "min", 0);
    			attr_dev(input7, "max", 20);
    			add_location(input7, file$1, 101, 8, 2799);
    			attr_dev(div10, "class", "daisy-ui");
    			add_location(div10, file$1, 97, 4, 2679);
    			attr_dev(button, "class", "svelte-ly0o17");
    			add_location(button, file$1, 110, 8, 3020);
    			attr_dev(div11, "class", "flex svelte-ly0o17");
    			add_location(div11, file$1, 109, 4, 2992);
    			attr_dev(div12, "class", "main svelte-ly0o17");
    			add_location(div12, file$1, 36, 0, 949);
    			binding_group.p(input0, input1, input2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, label0);
    			append_dev(label0, input0);
    			input0.checked = input0.__value === /*nameMatch*/ ctx[0];
    			append_dev(label0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, label1);
    			append_dev(label1, input1);
    			input1.checked = input1.__value === /*nameMatch*/ ctx[0];
    			append_dev(label1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, label2);
    			append_dev(label2, input2);
    			input2.checked = input2.__value === /*nameMatch*/ ctx[0];
    			append_dev(label2, t6);
    			append_dev(div12, t7);
    			append_dev(div12, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t9);
    			append_dev(div4, div3);
    			append_dev(div3, input3);
    			input3.checked = /*available*/ ctx[1];
    			append_dev(div12, t10);
    			append_dev(div12, div6);
    			append_dev(div6, label4);
    			append_dev(div6, t12);
    			append_dev(div6, div5);
    			append_dev(div5, input4);
    			input4.checked = /*reserved*/ ctx[2];
    			append_dev(div12, t13);
    			append_dev(div12, div8);
    			append_dev(div8, label5);
    			append_dev(div8, t15);
    			append_dev(div8, div7);
    			append_dev(div7, input5);
    			input5.checked = /*referral*/ ctx[3];
    			append_dev(div12, t16);
    			append_dev(div12, div9);
    			append_dev(div9, label6);
    			append_dev(label6, t17);
    			append_dev(label6, t18);
    			append_dev(div9, t19);
    			append_dev(div9, input6);
    			set_input_value(input6, /*limitRange*/ ctx[4]);
    			append_dev(div12, t20);
    			append_dev(div12, div10);
    			append_dev(div10, label7);
    			append_dev(label7, t21);
    			append_dev(label7, t22);
    			append_dev(div10, t23);
    			append_dev(div10, input7);
    			set_input_value(input7, /*offsetRange*/ ctx[5]);
    			append_dev(div12, t24);
    			append_dev(div12, div11);
    			append_dev(div11, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[8]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[10]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[11]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[12]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[13]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[14]),
    					listen_dev(input6, "change", /*input6_change_input_handler*/ ctx[15]),
    					listen_dev(input6, "input", /*input6_change_input_handler*/ ctx[15]),
    					listen_dev(input7, "change", /*input7_change_input_handler*/ ctx[16]),
    					listen_dev(input7, "input", /*input7_change_input_handler*/ ctx[16]),
    					listen_dev(button, "click", /*handleSubmit*/ ctx[6], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*nameMatch*/ 1) {
    				input0.checked = input0.__value === /*nameMatch*/ ctx[0];
    			}

    			if (dirty & /*nameMatch*/ 1) {
    				input1.checked = input1.__value === /*nameMatch*/ ctx[0];
    			}

    			if (dirty & /*nameMatch*/ 1) {
    				input2.checked = input2.__value === /*nameMatch*/ ctx[0];
    			}

    			if (dirty & /*available*/ 2) {
    				input3.checked = /*available*/ ctx[1];
    			}

    			if (dirty & /*reserved*/ 4) {
    				input4.checked = /*reserved*/ ctx[2];
    			}

    			if (dirty & /*referral*/ 8) {
    				input5.checked = /*referral*/ ctx[3];
    			}

    			if (dirty & /*limitRange*/ 16) set_data_dev(t18, /*limitRange*/ ctx[4]);

    			if (dirty & /*limitRange*/ 16) {
    				set_input_value(input6, /*limitRange*/ ctx[4]);
    			}

    			if (dirty & /*offsetRange*/ 32) set_data_dev(t22, /*offsetRange*/ ctx[5]);

    			if (dirty & /*offsetRange*/ 32) {
    				set_input_value(input7, /*offsetRange*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
    			binding_group.r();
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Filters', slots, []);
    	let nameMatch = 'partial';
    	let available = false;
    	let reserved = false;
    	let referral = false;
    	let limitRange = 20;
    	let offsetRange = 0;
    	let { domain = '' } = $$props;

    	const unsubscribeSearchNamesStore = searchNamesStore.subscribe(items => {
    		$$invalidate(7, domain = items);
    	});

    	onDestroy(() => {
    		unsubscribeSearchNamesStore();
    	});

    	const handleSubmit = async () => {
    		const filters = {
    			nameMatch,
    			available,
    			reserved,
    			referral,
    			limitRange,
    			offsetRange
    		};

    		await suggestionsDomain(domain, searchType, filters);
    		setFiltersStore({ filters });
    	};

    	const writable_props = ['domain'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Filters> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input0_change_handler() {
    		nameMatch = this.__value;
    		$$invalidate(0, nameMatch);
    	}

    	function input1_change_handler() {
    		nameMatch = this.__value;
    		$$invalidate(0, nameMatch);
    	}

    	function input2_change_handler() {
    		nameMatch = this.__value;
    		$$invalidate(0, nameMatch);
    	}

    	function input3_change_handler() {
    		available = this.checked;
    		$$invalidate(1, available);
    	}

    	function input4_change_handler() {
    		reserved = this.checked;
    		$$invalidate(2, reserved);
    	}

    	function input5_change_handler() {
    		referral = this.checked;
    		$$invalidate(3, referral);
    	}

    	function input6_change_input_handler() {
    		limitRange = to_number(this.value);
    		$$invalidate(4, limitRange);
    	}

    	function input7_change_input_handler() {
    		offsetRange = to_number(this.value);
    		$$invalidate(5, offsetRange);
    	}

    	$$self.$$set = $$props => {
    		if ('domain' in $$props) $$invalidate(7, domain = $$props.domain);
    	};

    	$$self.$capture_state = () => ({
    		suggestionsDomain,
    		searchNamesStore,
    		setFiltersStore,
    		onDestroy,
    		nameMatch,
    		available,
    		reserved,
    		referral,
    		limitRange,
    		offsetRange,
    		domain,
    		unsubscribeSearchNamesStore,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ('nameMatch' in $$props) $$invalidate(0, nameMatch = $$props.nameMatch);
    		if ('available' in $$props) $$invalidate(1, available = $$props.available);
    		if ('reserved' in $$props) $$invalidate(2, reserved = $$props.reserved);
    		if ('referral' in $$props) $$invalidate(3, referral = $$props.referral);
    		if ('limitRange' in $$props) $$invalidate(4, limitRange = $$props.limitRange);
    		if ('offsetRange' in $$props) $$invalidate(5, offsetRange = $$props.offsetRange);
    		if ('domain' in $$props) $$invalidate(7, domain = $$props.domain);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		nameMatch,
    		available,
    		reserved,
    		referral,
    		limitRange,
    		offsetRange,
    		handleSubmit,
    		domain,
    		input0_change_handler,
    		$$binding_groups,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler,
    		input4_change_handler,
    		input5_change_handler,
    		input6_change_input_handler,
    		input7_change_input_handler
    	];
    }

    class Filters extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { domain: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Filters",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get domain() {
    		throw new Error("<Filters>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set domain(value) {
    		throw new Error("<Filters>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    // (30:2) {#if searchType === 'premium'}
    function create_if_block(ctx) {
    	let filters;
    	let current;
    	filters = new Filters({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(filters.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(filters, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(filters.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(filters.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(filters, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(30:2) {#if searchType === 'premium'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div;
    	let h1;
    	let t1;
    	let header;
    	let t2;
    	let t3;
    	let cardcontainer;
    	let t4;
    	let additionaldomainslist;
    	let current;
    	header = new Header({ $$inline: true });
    	let if_block = /*searchType*/ ctx[0] === 'premium' && create_if_block(ctx);
    	cardcontainer = new CardContainer({ $$inline: true });
    	additionaldomainslist = new AdditionalDomainsList({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = `${/*title*/ ctx[1].toUpperCase()}`;
    			t1 = space();
    			create_component(header.$$.fragment);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			create_component(cardcontainer.$$.fragment);
    			t4 = space();
    			create_component(additionaldomainslist.$$.fragment);
    			attr_dev(h1, "class", "svelte-1e4z0ju");
    			add_location(h1, file, 23, 2, 685);
    			attr_dev(div, "class", "block svelte-1e4z0ju");
    			add_location(div, file, 22, 1, 662);
    			attr_dev(main, "class", "svelte-1e4z0ju");
    			add_location(main, file, 21, 0, 652);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			mount_component(header, div, null);
    			append_dev(div, t2);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t3);
    			mount_component(cardcontainer, div, null);
    			append_dev(div, t4);
    			mount_component(additionaldomainslist, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*searchType*/ ctx[0] === 'premium') {
    				if (if_block) {
    					if (dirty & /*searchType*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, t3);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(cardcontainer.$$.fragment, local);
    			transition_in(additionaldomainslist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(cardcontainer.$$.fragment, local);
    			transition_out(additionaldomainslist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			if (if_block) if_block.d();
    			destroy_component(cardcontainer);
    			destroy_component(additionaldomainslist);
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
    	validate_slots('App', slots, []);
    	let title = 'art';
    	let { searchType = '' } = $$props;

    	const unsubscribeSuggestionsTypeStore = suggestionsTypeStore.subscribe(items => {
    		$$invalidate(0, searchType = items);
    	});

    	onDestroy(() => {
    		unsubscribeSuggestionsTypeStore();
    	});

    	const writable_props = ['searchType'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('searchType' in $$props) $$invalidate(0, searchType = $$props.searchType);
    	};

    	$$self.$capture_state = () => ({
    		Header,
    		CardContainer,
    		AdditionalDomainsList,
    		Filters,
    		suggestionsTypeStore,
    		onDestroy,
    		title,
    		searchType,
    		unsubscribeSuggestionsTypeStore
    	});

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('searchType' in $$props) $$invalidate(0, searchType = $$props.searchType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [searchType, title];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { searchType: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get searchType() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set searchType(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {

    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
