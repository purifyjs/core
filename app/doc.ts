import type { Signal } from "../lib/core"
import { fragment, onConnected$, populate, signal, tagsNS } from "../lib/core"
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
					<input type="text" bind:value=${world} />
					<button on:click=${() => alert(`Hello ${world.ref}`)}>
						Hello ${world}
					</button>
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
				<button on:click=${() => (count.ref += 1)}>+</button>
				<span>${count}</span>
				<button on:click=${() => (count.ref -= 1)}>-</button>
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

//#region Templates
/* 
In **master-ts**, there are two primary ways to define templates for your content. 
Both approaches serve the same purpose of structuring and rendering your HTML elements 
but offer different syntax options. 
You can choose the one that best fits your coding style and project requirements.
*/

//#region Function-Based Template:
code(() => {
	const { div, span } = tagsNS
	div(
		{ class: "hello", "on:click": () => alert("Hello World") },
		"Hello",
		span({}, "World")
	)
	// end
})

/* 
In the example above, you import `tagsNS` proxy, and you destructure `div` and `span` from it. 
You then create the DOM elements using a function call and provide the element's attributes, directives, and content as arguments. 
This approach is more function-oriented and requires you to explicitly call functions to create elements.
*/
//#endregion

//#region Tagged Template Literal:
code(() => {
	html`
		<div class="hello" on:click=${() => alert("Hello World")}>
			Hello <span>World</span>
		</div>
	`
	// end
})

/* 
In example above, you import `html`, and you use a tagged template literal syntax to define your HTML structure.
This approach allows you to write HTML-like code within a template string and use `${}` to insert dynamic values or
expressions. It's more akin to writing HTML directly with embedded JavaScript expressions. One important point is
a tagged template literal will always returns an array of contents. The code above will return the array `[HTMLDivElement]`.
*/

/* 
One important point is a tagged template literal will always returns an array of contents. 
The code above will return the array `[HTMLDivElement]`.
*/
//#endregion
//#endregion

//#region Template Helpers
//#region Populate:
/* 
You can also use `populate()` to populate an already exisiting DOM element with attributes, directives, and content.
*/
code(() => {
	const { div, span } = tagsNS

	const myDiv = div()
	populate(myDiv, { class: "hello" }, "Hello", span({}, "World"))
	// end
})
//#endregion

//#region Fragment:
/*
You can convert any template content into `DocumentFragment` using `fragment()` function like shown above. 
Then you can easily append any template content to anywhere in the DOM.
*/
code(() => {
	const contents = html` <div class="hello">Hello World</div> `
	const contentsFragment = fragment(contents)
	document.body.append(contentsFragment)
	// end
})
//#endregion
//#endregion

//#region Life Cycle
/* 
You can observe if a <code>Node</code> is connected to DOM or not using
<code>onConnected$()</code> function. When a function has <code>$</code> at the end of it's name,
that means that function is being binded to a <code>Node</code>'s lifecycle.
*/
code(() => {
	const myNode = document.createComment("hello")
	onConnected$(myNode, () => {
		console.log(myNode, "Connected to the DOM")
		return () => console.log(myNode, "Disconnected from the DOM")
	})
	// end
})
//#endregion

//#region Signals
/*
In the world of <strong>master-ts</strong>, reactivity is made possible through the seamless
integration of signals. Signals serve a dual purpose: they allow for the observation of value
changes and enable efficient DOM manipulations.
*/

//#region Create:
/*
In the code below, we create a `Signal<string>`, and then mutate it.
*/
code(() => {
	// Create a signal with the initial value "foo"
	const foo: Signal<string> = signal("foo")
	// Mutate the signal
	foo.ref += "-bar"
	console.log(foo.ref) // foo-bar
	// end
})
//#endregion

//#region Follow:
/*
After following a signal manually, if you don't wanna follow the signal until the App exits, you
have to unfollow it manually.
*/
code(() => {
	// Create a signal with initial value
	const foo = signal("foo")
	// Follow the signal with the mode "immediate"
	// This will log "foo" immediately after the follow
	const follow = foo.follow((value) => console.log(value), {
		mode: "immediate"
	})
	// Update the signal to "bar"
	// This will log "bar"
	foo.ref = "bar"
	// Unfollow the signal
	follow.unfollow()
	// Update the signal to "baz"
	// This will not log anything
	foo.ref = "baz"
	// end
})
//#endregion

//#region Bind Follow:
/* 
You can bind a follow to a life cycle of a <code>Node</code>. This way you don't have to
unfollow manually. This follows naming convention mentioned in
[Life Cycle](#/usage/life-cycle) section.

The code below will do two things:

1. When `myNode` is connected to DOM, it will follow the signal
2. When `myNode` is disconnected from DOM, it will unfollow the signal
*/
code(() => {
	const myNode = document.createComment("myNode")
	const mySignal = signal(123)

	mySignal.follow$(myNode, (value) => {
		console.log(value)
	})
	// end
})

/* Same as: */
code(() => {
	const myNode = document.createComment("myNode")
	const mySignal = signal(123)
	onConnected$(
		myNode,
		mySignal.follow((value) => {
			console.log(value)
		}).unfollow
	)
	// end
})
//#endregion

//#endregion

//#endregion
