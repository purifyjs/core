import type { SignalOrValue } from "../lib/core"
import { onConnected$, populate, signal, tagsNS } from "../lib/core"
import { css } from "../lib/extra/css"
import { each } from "../lib/extra/each"
import { html } from "../lib/extra/html"
import { MyButton } from "./my-button"
const { button, div } = tagsNS

document.adoptedStyleSheets.push(
	css`
		:root {
			color-scheme: dark;
		}
	`
)

function randomHsl() {
	return `hsl(${Math.random() * 360 + Math.random()}, 75%, 35%)`
}

function App() {
	const host = div()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(style)

	const colors = signal(new Array(30).fill("").map(() => randomHsl()))

	onConnected$(host, () => colors.follow((value) => console.log("colors change", value)).unfollow)

	function add() {
		const index = Math.floor(Math.random() * colors.ref.length)
		colors.ref.splice(index, 0, randomHsl())
		colors.ping()
	}

	function remove() {
		const index = Math.floor(Math.random() * colors.ref.length)
		colors.ref.splice(index, 1)
		colors.ping()
	}

	function Item(color: SignalOrValue<string>) {
		return html`<div class="item" style:background-color=${color}>${color}</div>`
	}

	populate(
		dom,
		{},
		html`
			<div class="actions">
				<x ${MyButton()} on:click=${add}>Add</x>
				<button on:click=${remove}>Remove</button>
			</div>
		`,
		div(
			{ class: "actions" },
			populate(MyButton(), { "on:click": add }, "Add"),
			button({ "on:click": remove }, "Remove")
		),
		div(
			{ class: "content" },
			div({ class: "no-cache" }, () => colors.ref.map((color) => Item(color))),
			div({ class: "with-cache" }, () =>
				each(colors)
					.key((item) => item)
					.as((item) => Item(item))
			)
		)
	)

	return host
}

const style = css`
	:host {
		display: grid;
		align-content: start;
		gap: 1rem;
	}

	.actions {
		display: grid;
		grid-auto-flow: column;
		justify-content: start;
		place-items: center;
		gap: 1rem;
	}

	.content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		align-items: start;
	}

	.content > * {
		display: grid;
		align-content: start;
	}

	.item {
		display: grid;
		place-items: center;
	}
`

document.body.append(App())
