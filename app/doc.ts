import type { Signal } from "../lib/core"
import { derive, fragment, signal, tagsNS } from "../lib/core"
import { css } from "../lib/extra/css"
import { defineCustomTag } from "../lib/extra/custom-tags"
import { html } from "../lib/extra/html"

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
					<form
						on:submit=${(e) => (e.preventDefault(), alert(`Hello ${world.ref}`))}>
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

//#region Signals
//#region Signal Basics
/*
Signals are a part of the core of **master-ts**. 
They are the most basic building block of **master-ts** reactivity. 
*/

/* 
Signals are a wrapper around a value that notifies its followers when the value changes.<br/>
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
Signals also have an optional second argument called `pong`:
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
code(() => {
	const time = signal(Date.now(), (set) => {
		const interval = setInterval(() => set(Date.now()), 1000)
		return () => clearInterval(interval)
	})
	// end
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

Which let's you set the mode of following:
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
Which follows the naming convention mentioned in the [Lifecycle](#/usage/lifecycle).

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

//#endregion

//#region Derived Signals
/*
You can create a derived signal using the `derive()` function, which takes a function as its argument.<br/>
The function will be called every time one of the signals that are used inside the function changes.<br/>
These signals are called dependencies of the derived signal. By default, dependencies are added dynamically.
*/

export const derivedSignalExample = code(() => {
	const count = signal(0)

	// `count` is added as a dependency to `double` dynamically
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
	// Once you provide a static dependency to a derived signal it won't dynamically add new dependencies.
	const double = derive(() => count.ref * 2, [count])
	// end
})

/* 
There are few important things to note about derived signals:
-  They won't be calculated until they have at least one follower.
-  They update asynchronously, which means they won't update immediately after one of their dependencies changes.
*/

/* 
Another import thing to note is, The `derive()` function memoizes the derived signal of the function you provide to it.
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

//#region Read-only Signals
/* 
As you may have noticed [#Derived Signals](#/usage/signals/derived-signals) returns a read-only signal.

**master-ts** has read-only signals, hurry!🎊<br/>
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
