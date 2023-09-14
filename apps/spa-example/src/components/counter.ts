import { fragment, signal, tagsNS } from "master-ts/core"
import { css } from "master-ts/extra/css"
import { defineCustomTag } from "master-ts/extra/custom-tags"
import { html } from "master-ts/extra/html"

const counterTag = defineCustomTag("x-counter")
export function CountComponent(count = signal(0)) {
	const host = counterTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(style)

	const increment = () => count.ref++
	const decrement = () => count.ref--

	dom.append(tagsNS.slot())
	host.append(
		fragment(
			html`
				<button on:click=${increment}>+</button>
				<ul>
					<li>Count: ${count}</li>
					<li>Double: ${() => count.ref * 2}</li>
				</ul>
				<button on:click=${decrement}>-</button>
			`
		)
	)

	return host
}

const style = css`
	:host {
		display: grid;
		grid-auto-flow: column;
		justify-content: start;
		align-items: center;
	}
`
