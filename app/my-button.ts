import { fragment, tagsNS } from "../lib/core"
import { css } from "../lib/extra"

const { slot } = tagsNS

customElements.define("my-button", class extends HTMLButtonElement {}, { extends: "button" })
export function MyButton() {
	const el = document.createElement("my-button")
	const dom = el.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(style)

	dom.append(fragment("[", slot(), "]"))

	return el
}

const style = css`
	:host {
		display: grid;
		place-items: center;
		cursor: pointer;
		user-select: none;

		padding: 0.5rem 1rem;
		background-color: red;
		color: #fff;
	}
`
