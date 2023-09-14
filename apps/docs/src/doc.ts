import type { Signal } from "master-ts/core.ts"
import { derive, fragment, onConnected$, signal, tagsNS } from "master-ts/core.ts"
import { awaited } from "master-ts/extra/awaited.ts"
import { css } from "master-ts/extra/css.ts"
import { defineCustomTag } from "master-ts/extra/custom-tags.ts"
import { defer } from "master-ts/extra/defer.ts"
import { each } from "master-ts/extra/each.ts"
import { html } from "master-ts/extra/html.ts"
import { INSTANCEOF, TYPEOF, match } from "master-ts/extra/match.ts"

function code<T extends Utils.Fn>(block: T): () => ReturnType<T> {
	return () => block()
}

//#region Install
/*
To install master-ts follow the [Installation Instructions](https://github.com/DeepDoge/master-ts/releases)
*/
//#endregion

//#region Usage

/* 
**master-ts** designed to go hand in hand with browser's native APIs.
**master-ts** provides a set of functions and types to make your life easier when working with DOM.

**master-ts** focuses on two primary areas:
- **Reactivity**: Provides you with signal related functions and types to make your DOM reactive.
- **Templates**: Provides you with a set of functions and types to make your DOM templating easier.

Let's first get an idea of how a code that uses **master-ts** looks like:
*/

export const example = code(() => {
	const { div } = tagsNS

	function Hello() {
		const host = div()
		const dom = host.attachShadow({ mode: "open" })
		dom.adoptedStyleSheets.push(helloStyle)

		const world = signal("World")

		const counter = signal(0)

		dom.append(
			fragment(html`
				<div class="hello">
					<div>Hello</div>
					<form on:submit=${(e) => (e.preventDefault(), alert(`Hello ${world.ref}`))}>
						<input type="text" bind:value=${world} />
						<button>Hello ${world}</button>
					</form>
				</div>
				<div class="counts">
					<div>Counter</div>
					<x ${Counter(counter)} class="counter"></x>
					<div>Double: ${() => counter.ref * 2}</div>
				</div>
			`)
		)

		return host
	}

	const helloStyle = css`
		:host {
			display: grid;
			grid-auto-flow: row;
			gap: 1em;
		}

		.counter {
			border: solid 1px orangered;
		}
	`

	const counterTag = defineCustomTag("x-counter")
	function Counter(count = signal(0)) {
		const host = counterTag()
		const dom = host.attachShadow({ mode: "open" })
		dom.adoptedStyleSheets.push(counterStyle)

		dom.append(
			fragment(html`
				<button on:click=${() => count.ref++}>+</button>
				${count}
				<button on:click=${() => count.ref--}>-</button>
			`)
		)

		return host
	}

	const counterStyle = css`
		:host {
			display: inline-grid;
			grid-auto-flow: column;
			gap: 1em;
			align-items: center;
		}

		button {
			width: 4ch;
			aspect-ratio: 1;
		}
	`

	// end
	return Hello()
})

//#region Signal Basics
/*
Signals are the most basic building block of **master-ts** reactivity. 

A Signal is a wrapper around a value that notifies its followers when the value changes.<br/>
So it's a way to follow the changes of a value.
*/

/* Let's start with a basic example: */
export const basicSignalExample = code(() => {
	// Here we define a signal with the initial value of 0
	const foo = signal(0)

	// You can access the value of a signal using the `ref` property
	// which is a getter/setter
	foo.ref = 10 // We set the value of `foo` to 10

	// Signals also have a method called `ping()`
	// which notifies its followers regardless if the value has changed or not
	foo.ping()

	// Then we follow the signal
	// And alert the value of the signal every time it changes
	foo.follow((value) => alert(value))

	// end

	return html`
		<div>So here as you can see ${"`foo`"} starts from <strong>10</strong></div>
		<hr />
		<div>Foo: ${foo}</div>
		<button on:click=${() => foo.ref++}>Increment ${"`foo`"}</button>
		<button on:click=${() => foo.ref--}>Decrement ${"`foo`"}</button>
		<hr />
		<button on:click=${() => foo.ping()}>Ping ${"`foo`"}</button>
	`
})

//#region Creating Signals
/* 
Every signal requires an initial value:
*/
code(() => {
	// Here we define a signal with the initial value of "foo"
	const foo = signal("foo")
	// end
})
/* 
Signals also have an optional second argument called `pong`.
Which is a function that will be called when the signal has at least one follower.

Let's see an example:
*/
code(() => {
	const foo = signal("i have no followers", (set) => {
		// This function will be called when a signal has at least one follower
		console.log("foo has at least one follower")

		// Using the setter function `set()`, you can set the value of the signal
		set("i have followers now")

		// And you can also return a cleanup function
		// that will be called when a signal has no followers
		return () => {
			set("i have no followers")
			console.log("foo has no followers")
		}
	})
	// end
})
/* 
The `pong` argument enables you to do things like this:
*/
export const pongTimerExample = code(() => {
	const time = signal(Date.now(), (set) => {
		const interval = setInterval(() => set(Date.now()), 111)
		return () => clearInterval(interval)
	})
	// end

	return fragment(time)
})
//#endregion

//#region Setting and Getting Values
/*
Signals have a getter/setter property called `ref` that you can use to get/set the value of a signal:
*/
code(() => {
	const foo = signal("foo")
	foo.ref += "bar"
	console.log(foo.ref) // "foobar"
	// end
})
//#endregion

//#region Following Signals
/* 
Most primitive way to follow a signal is using the `follow()` function:
*/
code(() => {
	const foo = signal("foo")
	foo.follow((value) => console.log(value))
	// end
})
/* You have to unfollow a signal manually when you don't need it anymore: */
code(() => {
	const foo = signal("foo")
	const follower = foo.follow((value) => console.log(value))
	follower.unfollow()
	// end
})
/* 
Follow also has an optional second argument called `options`:

Which let's you set pick the mode of following:
- `immediate`: The follower will be notified immediately after following the signal
- `once`: The follower will be notified only once
- `normal`: This is the default mode. The follower will be notifed for the later changes of the signal
*/
code(() => {
	const foo = signal("foo")
	foo.follow((value) => console.log(value), { mode: "immediate" })
	foo.follow((value) => console.log(value), { mode: "once" })
	foo.follow((value) => console.log(value), { mode: "normal" })
	// end
})

//#region Binding following to a Node
/*
You can also follow a signal using the `follow$()` function.
Which follows the naming convention mentioned in the [#Lifecycle](#/usage/lifecycle).

The function `follow$()` will bind your follower to the lifecycle of a `Node`.
This way you don't have to unfollow a signal manually.
*/

export const follow$Example = code(() => {
	const node = document.createTextNode("Hello World")

	const foo = signal("foo", () => {
		alert("foo has at least one follower")
		return () => alert("foo has no followers")
	})

	// This will follow the signal when the node is connected to the DOM
	// And unfollow the signal when the node is disconnected from the DOM
	foo.follow$(node, (value) => console.log(value))

	// end
	const toggle = signal(false)
	return html`
		<div>${() => (toggle.ref ? node : null)}</div>
		<button on:click=${() => (toggle.ref = !toggle.ref)}>
			${() => (toggle.ref ? "Remove" : "Append")} ${"`node`"}
		</button>
	`
})
//#endregion
//#endregion

//#region Derived Signal
/*
You can create a derived signal using the `derive()` function, which takes a function as its first argument.<br/>
The function will be called when:
- It activated by having at least one follower.
- One of its dependencies changes/pings.

By default the derived signal will set its dependencies dynamically.
Which means it will add every signal that is used inside the function synchronously as a dependency.
This means first dynamic dependency will be added after the derived signal gets activated by having at least one follower.
*/

export const derivedSignalExample = code(() => {
	const count = signal(0)

	// `count` is added as a dependency to `double` dynamically
	// because it's used inside the function by getting its value using `count.ref`
	const double = derive(() => count.ref * 2)

	// end

	return html`
		<div>Count: ${count}</div>
		<div>Double: ${double}</div>
		<button on:click=${() => count.ref++}>Increment ${"`count`"}</button>
		<button on:click=${() => count.ref--}>Decrement ${"`count`"}</button>
	`
})

/* 
You can also provide static dependencies to the derived signal as second argument:
*/
code(() => {
	const count = signal(0)

	// Here we provide `count` as a static dependency to `double`
	// Once you provide a static dependency to a derived signal
	// it won't add new dependencies dynamically .
	const double = derive(() => count.ref * 2, [count])
	// end
})

/* 
There are few important things to note about derived signals:
-  They won't be calculated until they have at least one follower.
-  They update asynchronously, which means they won't update immediately after one of their dependencies changes.
	Reason for this behavior is because `MutationsObserver` is not synchronous, 
	which means we can't detect when a node is removed from the DOM synchronously.
	If we can't detect that synchronously, we can't unfollow the derived signal synchronously.
	Which makes derived signal update when it's not supposed to. So we have to update it asynchronously.
	Which is not a big deal because other frameworks and libraries also has the same behavior.
	And it's better for performance too, kinda.
*/

/* 
Another import thing to note is, The `derive()` function memoizes the derived signal it returns.
Which if you try to create a derived signal with the same function it will return the same derived signal.

This happens internally using a `WeakMap` that maps the function to the derived signal.

Proof:
*/
export const derivedSignalMemoizationExample = code(() => {
	const count = signal(0)
	const doubleFn = () => count.ref * 2

	const double1 = derive(doubleFn)
	const double2 = derive(doubleFn)

	const runAlert = () => alert(`double1 === double2: ${double1 === double2}`) // true

	// end

	return html` <button on:click=${runAlert}>Run Alert</button> `
})

//#endregion

//#region Read-only Signal
/* 
As you may have noticed [#Derived Signals](#/usage/signals/derived-signals) returns a read-only signal.

**master-ts** has read-only signals, hurray!🎊<br/>
But its probably not what you think it is. 

Good thing about being a TypeScript only library is we can do stuff with types that would normally require runtime logic.

Yes, read-only signals are just signals with a read-only type.

Let's see an example:
*/
code(() => {
	const count: Readonly<Signal<number>> = signal(0)
	// @ts-expect-error
	count.ref = 10 // Error: Cannot assign to 'ref' because it is a read-only property.
	// end
})
/* As an easier way you can also do this: */
code(() => {
	// `asReadonly()` returns the same signal with the read-only type
	const count = signal(0).asReadonly()
	// @ts-expect-error
	count.ref = 10 // Error: Cannot assign to 'ref' because it is a read-only property.
	// end
})
//#endregion

//#endregion

//#region Lifecycle
/*
**master-ts** provides you with a function called `onConnected$()` to follow the lifecycle of a `Node`.<br/>
`$` at the end of the function name is a convention to indicate that the function follows the lifecycle of a `Node`.
You can see the same naming convention used at the 
[#Binding following to a Node](#/usage/signal-basics/following-signals/binding-following-to-a-node) section.

`onConnected$()` takes a `Node` as its first argument and a function as its second argument.<br/>
The function will be called when the `Node` is connected to the DOM.<br/>
Also, you can return a cleanup function from the function you provide to `onConnected$()`.<br/>
The cleanup function will be called when the `Node` is disconnected from the DOM.

Let's see an example:
*/
export const onConnected$Example = code(() => {
	const node = document.createTextNode("Hello World")

	onConnected$(node, () => {
		alert("node is connected to the DOM")
		return () => alert("node is disconnected from the DOM")
	})

	// end

	const toggle = signal(false)
	return html`
		<button on:click=${() => (toggle.ref = !toggle.ref)}>
			${() => (toggle.ref ? "Remove" : "Append")} ${"`node`"}
		</button>
		<div>${() => (toggle.ref ? node : null)}</div>
	`
})
//#endregion

//#region Templates
/*
 **master-ts** provides you with a set of functions and types to make your DOM templating easier.
 */

//#region HTML Templates
/*
In **master-ts** there is two ways to create HTML templates:
- Using the `html` template literal tag.
- And using the `tagsNS` `Proxy` namespace. Which is a part of the core of **master-ts**.

Let's see an example of both:
*/
export const htmlTemplateExample = code(() => {
	const { div, button } = tagsNS

	const foo = signal(0)
	const bar = signal(0)

	const example1 = div(
		{ class: "hello" },
		div({}, "Foo:", foo),
		div({}, "Bar:", bar),
		div(
			{ class: "actions" },
			button({ "on:click": () => foo.ref++ }, "Increment Foo"),
			" ",
			button({ "on:click": () => bar.ref++ }, "Increment Bar")
		)
	)

	const example2 = html`
		<div class="hello">
			<div>Foo: ${foo}</div>
			<div>Bar: ${bar}</div>
			<div class="actions">
				<button on:click=${() => foo.ref++}>Increment Foo</button>
				<button on:click=${() => bar.ref++}>Increment Bar</button>
			</div>
		</div>
	`

	return html`
		<div>Example 1:</div>
		${example1}
		<hr />
		<div>Example 2:</div>
		${example2}
	`

	// end
})

/*
As you can see both examples are the same. But there is a few things to note:
- `html` template literal tag always returns an `Array` of `Node`s. While `tagsNS` `Proxy` namespace returns the `Node` itself.
- `tagsNS` has better TypeScript support. Which means you get better type checking and auto-completion.
*/

//#region Why does `html` Template Literal Tag returns an Array and not a DocumentFragment?
/*
You may be wondering why `html` template literal tag returns an `Array` of `Node`s and not a `DocumentFragment`?
Well because once you append a `DocumentFragment` to the DOM, it will be emptied.
Which makes the reference to it useless. So it makes things like memoized toggling impossible or at least very hard.

Another reason is, `DocumentFragment` can only hold `Node`s. Which means you can't append a `signal` to a `DocumentFragment`.<br/>
And if you render the `signal` before appending it to the `DocumentFragment`, you will create ghost nodes in the DOM
that would mean nothing if the `signal` changes.

That's why returning an `Array` of `Node`s over a `DocumentFragment` decided to be a better option.
*/
//#endregion

//#endregion

//#endregion

//#region Advanced Signals

//#region Deffered Signal
/*
Deffered signals are signals that are updated after their source signal has stopped changing for a specific amount of time.

This is useful when you want to update a signal after a user has stopped typing for example.

You can create a deffered signal using the `defer()` function:
*/
export const deferredSignalExample = code(() => {
	const text = signal("Change me!")
	const defferedTextDefault = defer(text) // default timeout is 250ms
	const defferedTextOneSecond = defer(text, 1000)

	// end

	return html`
		<input type="text" bind:value=${text} />
		<div><b>Text:</b> ${text}</div>
		<div><b>Deffered Text (Default):</b> ${defferedTextDefault}</div>
		<div><b>Deffered Text (1s):</b> ${defferedTextOneSecond}</div>
	`
})
//#endregion

//#region Awaited Signal
/*
Awaited signals are derived from `Promise`s. They are signals that are updated when the `Promise` resolves.

You can create an awaited signal using the `awaited()` function:
*/
export const awaitedSignalExample = code(() => {
	const text = signal("change me!")

	async function upperCase(text: string) {
		await new Promise((resolve) => setTimeout(resolve, 1000))
		return text.toUpperCase()
	}

	// You can mix derived signals with awaited signals
	const awaitedPromise = derive(() => awaited(upperCase(text.ref)), [text])

	// end

	return html`
		<input type="text" bind:value=${text} />
		<div><b>Text:</b> ${text}</div>
		<div><b>Awaited Promise:</b> ${awaitedPromise}</div>
	`
})
/* 
By default initial value of an awaited signal is `null`.

You can also provide a second argument to the `awaited()` function which will be used as the initial value of the awaited signal:
*/
export const awaitedSignalInitialValueExample = code(() => {
	const text = signal("change me!")

	async function upperCase(text: string) {
		await new Promise((resolve) => setTimeout(resolve, 1000))
		return text.toUpperCase()
	}

	const awaitedPromise = derive(() => awaited(upperCase(text.ref), "loading..."), [text])

	// end

	return html`
		<input type="text" bind:value=${text} />
		<div><b>Text:</b> ${text}</div>
		<div><b>Awaited Promise:</b> ${awaitedPromise}</div>
	`
})
//#endregion

//#region Each Signal
/*
Each signals are derived from `Signal<Array>`s. They are signals that maps and memoizes the values of an array each time the array changes.
*/
function randomId() {
	return Math.random().toString(36).slice(2)
}
export const eachSignalExample = code(() => {
	function createItem(text: string) {
		return {
			id: randomId(),
			text
		}
	}

	const items = signal([
		createItem("foo"),
		createItem("bar"),
		createItem("baz"),
		createItem("qux"),
		createItem("quux"),
		createItem("corge"),
		createItem("grault"),
		createItem("garply"),
		createItem("waldo"),
		createItem("fred")
	])

	function randomlyMoveItem() {
		const index = Math.floor(Math.random() * items.ref.length)
		const item = items.ref[index]!
		items.ref.splice(index, 1)
		items.ref.splice(Math.floor(Math.random() * items.ref.length), 0, item)
		items.ping()
	}

	const itemsWithRandomText = each(items)
		.key((item, index) => item.id)
		.as((item, index) => html` <div>${() => item.ref.text} - ${index} ${randomId()}</div> `)

	return html`
		<div>
			<button on:click=${randomlyMoveItem}>Randomly Move Item</button>
		</div>
		<div>${itemsWithRandomText}</div>
	`

	// end
})
/* 
Ok, let's understand what's going on up there.

We have created a signal called `items` which is an array of objects with `id` and `text` properties.

Then we map the `items` signal to a new signal called `itemsWithRandomText` using the `each()` function.<br/>
There is a few things going on here:
- We use the `key()` function to memoize the items using their `id` property.
This way when the `items` array changes, the items with the same `id` won't be re-rendered 
meaning the function inside `as()` won't be called again for those items.
- Internally `each()` uses `Map` to memoize the items. So you can use any type as a key.
- If you noticed unlike the `key()` function, inside the `as()` function `item` and `index` arguments are signals.
Reason for that is even though `key` is the same for an `item`, `item` itself and index of the `item` can change.<br/>
So function inside `as()` won't called again for the same `key` but `item` and `index` can change.<br/>

Proof of function inside `as()` won't be called again for the same `key` is; 
When you click the `Randomly Move Item` button, `${randomId()}` inside the `as()` function won't change.

If you inspect the DOM of the Example above you will see that when you click the `Randomly Move Item` button,
minimum number of DOM nodes are changed. This is thanks to how master-ts templates handle signal arrays.
As long as you are giving the same items to an array, template is gonna do its best to not change the DOM.

So `each()` itself doesn't do any DOM manipulation. It just maps signal of an array while memoizing the items based on the `key` you provide.
It's basically a memoized version of `Array.prototype.map()` for signals.

Simple explanation for dummies; If you wanna list signal of an array, use `each()` instead of `Array.prototype.map()`.

*/
//#endregion

//#region Match Signal
/*
YOu can pattern match a signal using the `match()` function. 
This let's you check type of a signal do return a different value based on the type of the signal.
It only changing the value when the case changes. And has full TypeScript support.

Easier to understand with an example:
*/
export const matchSignalExample = code(() => {
	type Foo = { type: "foo"; value: number }
	type Bar = { type: "bar"; value: string }
	type FooBar = Foo | Bar

	const fooBar = signal<FooBar>({ type: "foo", value: 0 })

	function randomString() {
		return Math.random().toString(36).slice(2)
	}
	function randomInt() {
		return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
	}

	function changeValue() {
		fooBar.ref.value = fooBar.ref.type === "foo" ? randomInt() : randomString()
		fooBar.ping()
	}

	function switchType() {
		fooBar.ref =
			fooBar.ref.type === "foo"
				? {
						type: "bar",
						value: randomString()
				  }
				: {
						type: "foo",
						value: randomInt()
				  }
	}

	// Let's create some counters to check which template is being rendered
	let fooCounter = 0
	let barCounter = 0

	return html`
		<div>
			<button on:click=${switchType}>Switch Type</button>
			<button on:click=${changeValue}>Change Value</button>
		</div>
		<div>
			${match(fooBar)
				.case(
					{ type: "foo" },
					(foo) => html`<div>Foo: ${() => foo.ref.value} - Rendered ${++fooCounter} times</div>`
				)
				.case(
					{ type: "bar" },
					(bar) => html`<div>Bar: ${() => bar.ref.value} - Rendered ${++barCounter} times</div>`
				)
				.default()}
		</div>
	`

	// end
})

/* 
So everytime signal changes, `match()` will check if the case has changed or not.
If the case has changed, it will call the function inside `case()` and return the value of the function.

So even though `fooBar` signal changes, `match()` will only call the function inside `case()` when the `type` changes.
So it will only call the function when case changes.

`match()` also has a `default()` function which will be called when none of the cases matches the signal.
And same rules apply to `default()` function too. It will only be called when the case changes.

TypeScript will force us to handle all cases or provide a `default()` function.
In this case TypeScript won't let us put a function inside `default()` because we exhausted all the cases.

But placing `default()` to close the `match()` even if it's empty is required because it returns the result signal.
Otherwise you will get the `MatchBuilder` instead of the result signal.

Now we understand how `match()` works. Let's see more examples:
*/

/* 
We don't have to match object patterns, we can also match primitive values:
*/
export const matchSignalExample2 = code(() => {
	const foo = signal<string | null>("foo")

	return html`
		<div>
			${match(foo)
				.case(null, () => html`<div>Foo is null</div>`)
				.default((value) => html`<div>${value} - ${() => value.ref.toUpperCase()}</div>`)}
		</div>
	`
	// end
})

/*
We can also match `typeof` a signal:
*/
export const matchSignalExample3 = code(() => {
	const foo = signal<string | null>("foo")

	return html`
		<div>
			${match(foo)
				.case({ [TYPEOF]: "string" }, (value) => html`<div>${value} - ${() => value.ref.toUpperCase()}</div>`)
				.default(() => html`<div>Foo is null</div>`)}
		</div>
	`
	// end
})

/*
Same for `instanceof`:
*/
export const matchSignalExample4 = code(() => {
	const foo = signal<Date | null>(new Date())

	return html`
		<div>
			${match(foo)
				.case({ [INSTANCEOF]: Date }, (value) => html`<div>${value}</div>`)
				.default(() => html`<div>Foo is null</div>`)}
		</div>
	`
	// end
})

/*
And all of these are fully type checked by TypeScript. Correctly narrowed, exhausted and everything.
You can experiment with it and see for yourself. 
Also, open an issue if you find any weird behavior: [Github Issues](https://github.com/DeepDoge/master-ts/issues)
*/

//#endregion

//#endregion

//#endregion
