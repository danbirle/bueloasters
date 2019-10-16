
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(document);
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
    function null_to_empty(value) {
        return value == null ? '' : value;
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
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
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
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

    const globals = (typeof window !== 'undefined' ? window : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
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
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
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
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Card\Card.svelte generated by Svelte v3.12.1 */

    const file = "src\\Card\\Card.svelte";

    function create_fragment(ctx) {
    	var div, button, button_class_value, div_class_value, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			attr_dev(button, "class", button_class_value = "" + null_to_empty((ctx.selected && ctx.selected === ctx.id ? 'selected' : '')) + " svelte-1p5584s");
    			attr_dev(button, "style", ctx.isCardFacingUp);
    			add_location(button, file, 64, 4, 1457);
    			attr_dev(div, "class", div_class_value = "card" + (ctx.role === 'shield' ? ' shield' : '') + (ctx.role === 'hand' ? ' hand' : '') + (ctx.role === 'graveyard' ? ' graveyard' : '') + (ctx.role === 'mana' ? ' mana' : '') + (ctx.role === 'battle' ? ' battle' : '') + " svelte-1p5584s");
    			add_location(div, file, 57, 0, 1223);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.selected || changed.id) && button_class_value !== (button_class_value = "" + null_to_empty((ctx.selected && ctx.selected === ctx.id ? 'selected' : '')) + " svelte-1p5584s")) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if ((changed.role) && div_class_value !== (div_class_value = "card" + (ctx.role === 'shield' ? ' shield' : '') + (ctx.role === 'hand' ? ' hand' : '') + (ctx.role === 'graveyard' ? ' graveyard' : '') + (ctx.role === 'mana' ? ' mana' : '') + (ctx.role === 'battle' ? ' battle' : '') + " svelte-1p5584s")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { role, name, selected, setSelected, id } = $$props;

        const isCardFacingUp = 
            role==='hand' || role==='battle' || role==='mana' ?
            'background-image: url(cards/' + name + '.jpg);' :
            '';

    	const writable_props = ['role', 'name', 'selected', 'setSelected', 'id'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (event) => {
    	            if (role === 'hand') {
    	                console.log('R hand ', id);
    	                setSelected(id);
    	            }
    	        };

    	$$self.$set = $$props => {
    		if ('role' in $$props) $$invalidate('role', role = $$props.role);
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('setSelected' in $$props) $$invalidate('setSelected', setSelected = $$props.setSelected);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    	};

    	$$self.$capture_state = () => {
    		return { role, name, selected, setSelected, id };
    	};

    	$$self.$inject_state = $$props => {
    		if ('role' in $$props) $$invalidate('role', role = $$props.role);
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('setSelected' in $$props) $$invalidate('setSelected', setSelected = $$props.setSelected);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    	};

    	return {
    		role,
    		name,
    		selected,
    		setSelected,
    		id,
    		isCardFacingUp,
    		click_handler
    	};
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["role", "name", "selected", "setSelected", "id"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Card", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.role === undefined && !('role' in props)) {
    			console.warn("<Card> was created without expected prop 'role'");
    		}
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<Card> was created without expected prop 'name'");
    		}
    		if (ctx.selected === undefined && !('selected' in props)) {
    			console.warn("<Card> was created without expected prop 'selected'");
    		}
    		if (ctx.setSelected === undefined && !('setSelected' in props)) {
    			console.warn("<Card> was created without expected prop 'setSelected'");
    		}
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<Card> was created without expected prop 'id'");
    		}
    	}

    	get role() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set role(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setSelected() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set setSelected(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Player\Player.svelte generated by Svelte v3.12.1 */
    const { console: console_1 } = globals;

    const file$1 = "src\\Player\\Player.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.deckCard = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.shieldCard = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.manaCard = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.handCard = list[i];
    	return child_ctx;
    }

    // (170:1) {#each handCards as handCard}
    function create_each_block_3(ctx) {
    	var current;

    	var card = new Card({
    		props: {
    		role: "hand",
    		id: ctx.handCard.id,
    		selected: ctx.selected,
    		setSelected: ctx.setSelected,
    		name: ctx.handCard.name
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			card.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var card_changes = {};
    			if (changed.selected) card_changes.selected = ctx.selected;
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
    			destroy_component(card, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_3.name, type: "each", source: "(170:1) {#each handCards as handCard}", ctx });
    	return block;
    }

    // (183:1) {#each manaCards as manaCard}
    function create_each_block_2(ctx) {
    	var current;

    	var card = new Card({
    		props: {
    		role: "mana",
    		id: ctx.manaCard.id,
    		selected: ctx.selected,
    		setSelected: ctx.setSelected,
    		name: ctx.manaCard.name
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			card.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var card_changes = {};
    			if (changed.selected) card_changes.selected = ctx.selected;
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
    			destroy_component(card, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_2.name, type: "each", source: "(183:1) {#each manaCards as manaCard}", ctx });
    	return block;
    }

    // (191:1) {#each shieldCards as shieldCard}
    function create_each_block_1(ctx) {
    	var current;

    	var card = new Card({
    		props: { role: "shield", name: ctx.shieldCard.name },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			card.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},

    		p: noop,

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
    			destroy_component(card, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block_1.name, type: "each", source: "(191:1) {#each shieldCards as shieldCard}", ctx });
    	return block;
    }

    // (196:1) {#each deckCards as deckCard}
    function create_each_block(ctx) {
    	var current;

    	var card = new Card({
    		props: { role: "deck", name: ctx.deckCard.name },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			card.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},

    		p: noop,

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
    			destroy_component(card, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(196:1) {#each deckCards as deckCard}", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var main, t0, section0, t1, t2, t3, section1, t5, section2, t7, main_style_value, current, dispose;

    	let each_value_3 = ctx.handCards;

    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const out = i => transition_out(each_blocks_3[i], 1, 1, () => {
    		each_blocks_3[i] = null;
    	});

    	let each_value_2 = ctx.manaCards;

    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out_1 = i => transition_out(each_blocks_2[i], 1, 1, () => {
    		each_blocks_2[i] = null;
    	});

    	let each_value_1 = ctx.shieldCards;

    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out_2 = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = ctx.deckCards;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out_3 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t0 = space();
    			section0 = element("section");
    			t1 = space();

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t2 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			section1 = element("section");
    			section1.textContent = "Battle zone";
    			t5 = space();
    			section2 = element("section");
    			section2.textContent = "Graveyard";
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(section0, "class", "gMana svelte-13fi6u3");
    			add_location(section0, file$1, 177, 1, 3646);
    			attr_dev(section1, "class", "gBattle svelte-13fi6u3");
    			add_location(section1, file$1, 193, 1, 4067);
    			attr_dev(section2, "class", "gGraveyard svelte-13fi6u3");
    			add_location(section2, file$1, 194, 1, 4116);
    			attr_dev(main, "class", "player svelte-13fi6u3");
    			attr_dev(main, "style", main_style_value = ctx.id === 2 ? ctx.flipOpponent : '');
    			add_location(main, file$1, 168, 0, 3412);
    			dispose = listen_dev(section0, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(main, null);
    			}

    			append_dev(main, t0);
    			append_dev(main, section0);
    			append_dev(main, t1);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(main, null);
    			}

    			append_dev(main, t2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(main, null);
    			}

    			append_dev(main, t3);
    			append_dev(main, section1);
    			append_dev(main, t5);
    			append_dev(main, section2);
    			append_dev(main, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.handCards || changed.selected || changed.setSelected) {
    				each_value_3 = ctx.handCards;

    				let i;
    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(changed, child_ctx);
    						transition_in(each_blocks_3[i], 1);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						transition_in(each_blocks_3[i], 1);
    						each_blocks_3[i].m(main, t0);
    					}
    				}

    				group_outros();
    				for (i = each_value_3.length; i < each_blocks_3.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}

    			if (changed.manaCards || changed.selected || changed.setSelected) {
    				each_value_2 = ctx.manaCards;

    				let i;
    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(changed, child_ctx);
    						transition_in(each_blocks_2[i], 1);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						transition_in(each_blocks_2[i], 1);
    						each_blocks_2[i].m(main, t2);
    					}
    				}

    				group_outros();
    				for (i = each_value_2.length; i < each_blocks_2.length; i += 1) {
    					out_1(i);
    				}
    				check_outros();
    			}

    			if (changed.shieldCards) {
    				each_value_1 = ctx.shieldCards;

    				let i;
    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(main, t3);
    					}
    				}

    				group_outros();
    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out_2(i);
    				}
    				check_outros();
    			}

    			if (changed.deckCards) {
    				each_value = ctx.deckCards;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(main, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_3(i);
    				}
    				check_outros();
    			}

    			if ((!current || changed.id || changed.flipOpponent) && main_style_value !== (main_style_value = ctx.id === 2 ? ctx.flipOpponent : '')) {
    				attr_dev(main, "style", main_style_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks_3[i]);
    			}

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks_2[i]);
    			}

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks_3 = each_blocks_3.filter(Boolean);
    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				transition_out(each_blocks_3[i]);
    			}

    			each_blocks_2 = each_blocks_2.filter(Boolean);
    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				transition_out(each_blocks_2[i]);
    			}

    			each_blocks_1 = each_blocks_1.filter(Boolean);
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(main);
    			}

    			destroy_each(each_blocks_3, detaching);

    			destroy_each(each_blocks_2, detaching);

    			destroy_each(each_blocks_1, detaching);

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function shuffle(cards) {
    	for(let i = cards.length - 1; i > 0; i--){
    		const j = Math.floor(Math.random() * i);
    		const temp = cards[i];
    		cards[i] = cards[j];
    		cards[j] = temp;
    	}

    	return cards;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { name, id = 1, health, flipOpponent = 'transform: scale(-1)' } = $$props;

    	//mockCards
    	let cards = shuffle([
    		{
    			id: 1,
    			name: 'AquaRanger',
    			element: 'water',
    			damage: 3000,
    			manaCost: 6,
    			role: 'deck',
    			abilities: {
    				unBlockable: true,
    				unDying: true,
    			}
    		},
    		{
    			id: 2,
    			name: 'EmperorQuazla',
    			element: 'water',
    			damage: 5000,
    			manaCost: 6,
    			role: 'deck',
    			abilities: {
    				blocker: true,
    				evolution: true,
    			}
    		},
    		{
    			id: 3,
    			name: 'KachuaKeeperoftheIcegate',
    			element: 'grass',
    			damage: 3000,
    			manaCost: 7,
    			role: 'deck'
    		},
    		{
    			id: 4,
    			name: 'KuukaiFinderofKarma',
    			element: 'light',
    			damage: 10500,
    			manaCost: 5,
    			role: 'deck',
    			abilities: {
    				blocker: true,
    				evolution: true,
    			}
    		},
    		{
    			id: 5,
    			name: 'MagmadragonJagalzor',
    			element: 'fire',
    			damage: 6000,
    			manaCost: 6,
    			role: 'deck',
    			abilities: {
    				doubleBreaker: true,
    				charge: true,
    			}
    		},
    		{
    			id: 6,
    			name: 'MegariaEmpressofDread',
    			element: 'darkness',
    			damage: 5000,
    			manaCost: 5,
    			role: 'deck'
    		},
    		{
    			id: 7,
    			name: 'MigaloVizierofSpycraft',
    			element: 'light',
    			damage: 1500,
    			manaCost: 2,
    			role: 'deck',
    		},
    		{
    			id: 8,
    			name: 'SuperNecrodragonAbzoDolba',
    			element: 'darkness',
    			damage: 11000,
    			manaCost: 6,
    			role: 'deck',
    			abilities: {
    				tripleBreaker: true,
    				evolution: true,
    			}
    		},
    	]);

    	function generateShields(givenHealth) {
    		const shieldCards = cards.filter(card => cards.indexOf(card) < givenHealth - 1);
    		cards = cards.filter(card => cards.indexOf(card) < givenHealth - 1);
    		return shieldCards;
    	}	function generateHand() {
    		const shieldCards = cards.filter(card => cards.indexOf(card) < 5);
    		cards = cards.filter(card => cards.indexOf(card) < 5);
    		return shieldCards;
    	}
    	let shieldCards = generateShields(health);
    	let handCards = generateHand();
    	let manaCards = [];
    	let battleCards = [];
    	let deckCards = cards;

    	let selected = '';
    	const setSelected = (value) => {
    		$$invalidate('selected', selected = value);
    	};
    	const moveSelectedToMana = (selectedCard) => {
    		manaCards.push(selectedCard);
    		handCards.filter((handCard) => handCards.indexOf(handCard) === -1);
    	};

    	const writable_props = ['name', 'id', 'health', 'flipOpponent'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<Player> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    			console.log('!R selected: ', selected);
    			moveSelectedToMana(selected);
    			setSelected('');
    		};

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('health' in $$props) $$invalidate('health', health = $$props.health);
    		if ('flipOpponent' in $$props) $$invalidate('flipOpponent', flipOpponent = $$props.flipOpponent);
    	};

    	$$self.$capture_state = () => {
    		return { name, id, health, flipOpponent, cards, shieldCards, handCards, manaCards, battleCards, deckCards, selected };
    	};

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('health' in $$props) $$invalidate('health', health = $$props.health);
    		if ('flipOpponent' in $$props) $$invalidate('flipOpponent', flipOpponent = $$props.flipOpponent);
    		if ('cards' in $$props) cards = $$props.cards;
    		if ('shieldCards' in $$props) $$invalidate('shieldCards', shieldCards = $$props.shieldCards);
    		if ('handCards' in $$props) $$invalidate('handCards', handCards = $$props.handCards);
    		if ('manaCards' in $$props) $$invalidate('manaCards', manaCards = $$props.manaCards);
    		if ('battleCards' in $$props) battleCards = $$props.battleCards;
    		if ('deckCards' in $$props) $$invalidate('deckCards', deckCards = $$props.deckCards);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	return {
    		name,
    		id,
    		health,
    		flipOpponent,
    		shieldCards,
    		handCards,
    		manaCards,
    		deckCards,
    		selected,
    		setSelected,
    		moveSelectedToMana,
    		console,
    		click_handler
    	};
    }

    class Player extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["name", "id", "health", "flipOpponent"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Player", options, id: create_fragment$1.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console_1.warn("<Player> was created without expected prop 'name'");
    		}
    		if (ctx.health === undefined && !('health' in props)) {
    			console_1.warn("<Player> was created without expected prop 'health'");
    		}
    	}

    	get name() {
    		throw new Error("<Player>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Player>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Player>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Player>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get health() {
    		throw new Error("<Player>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set health(value) {
    		throw new Error("<Player>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flipOpponent() {
    		throw new Error("<Player>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flipOpponent(value) {
    		throw new Error("<Player>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.12.1 */

    function create_fragment$2(ctx) {
    	var t, current;

    	var player0 = new Player({
    		props: {
    		name: 'player 2',
    		id: 2,
    		health: 6
    	},
    		$$inline: true
    	});

    	var player1 = new Player({
    		props: { name: 'player 1', health: 6 },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			player0.$$.fragment.c();
    			t = space();
    			player1.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(player0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(player1, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(player0.$$.fragment, local);

    			transition_in(player1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(player0.$$.fragment, local);
    			transition_out(player1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(player0, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(player1, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$2.name });
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
