import { fragment, signal } from "master-ts/core"
import { css } from "master-ts/extra/css"
import { html } from "master-ts/extra/html"
import { CountComponent } from "./components/counter"

function App() {
	const world = signal("World")

	return html`
		<h1>Hello ${world}</h1>
		<div>
			<input bind:value=${world} />
			<button on:click=${() => (world.ref = "World")}>World</button>
			<button on:click=${() => (world.ref = "Mars")}>Mars</button>
		</div>
		<x ${CountComponent()} class="my-counter"></x>
	`
}

document.adoptedStyleSheets.push(css`
	:root {
		font-size: 4em;
	}

	input {
		font-size: inherit;
		max-width: 100%;
	}

	ul {
		margin: 0;
		padding: 0;
	}

	li {
		list-style: none;
	}

	button {
		font-size: inherit;
	}
`)

document.body.append(fragment(App()))
