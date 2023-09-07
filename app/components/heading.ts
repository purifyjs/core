import { fragment, populate, signal } from "@/../lib/core"
import { css } from "@/../lib/extra/css"
import { html } from "@/../lib/extra/html"
import { commonStyle } from "@/styles"

const hash = signal(location.hash, (set) => {
	const interval = setInterval(() => set(location.hash), 100)
	return () => clearInterval(interval)
})

export function Heading<T extends HTMLHeadingElement>(host: T, id: string) {
	populate(host, {
		class: "heading",
		id,
		"class:active": () => hash.ref === `#${id}`
	})
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, style)

	hash.follow$(
		host,
		(hash) => {
			if (hash === `#${id}`) host.scrollIntoView({ block: "center", inline: "nearest" })
		},
		{ mode: "immediate" }
	)

	dom.append(fragment(html`<a href=${`#${id}`}>#</a> <slot />`))

	return host
}

const style = await css`
	a {
		color: inherit;
		opacity: 0.5;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
`
