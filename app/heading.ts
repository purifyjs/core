import { fragment, onConnected$, populate } from "@/../lib/core"
import { css } from "@/../lib/extra/css"
import { html } from "@/../lib/extra/html"

export function Heading(host: HTMLElement, id: string) {
	populate(host, { id })
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(style)

	onConnected$(host, () => {
		if (location.hash === `#${id}`) host.scrollIntoView({ inline: "start" })
	})

	dom.append(fragment(html`<a href=${`#${id}`}>#</a> <slot />`))

	return host
}

const style = css`
	a {
		color: inherit;
		opacity: 0.5;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
`
