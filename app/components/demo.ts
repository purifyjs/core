import { fragment } from "@/../lib/core"
import { css } from "@/../lib/extra/css"
import { html } from "@/../lib/extra/html"
import { defineCustomTag } from "../../lib/extra/custom-tags"

const demoTag = defineCustomTag("x-demo")
export function DemoWrapper() {
	const host = demoTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(style)

	dom.append(
		fragment(html`
			<div class="content">
				<slot></slot>
			</div>
		`)
	)

	return host
}

const style = await css`
	:host {
		display: grid;
		padding-block: 0.5em;
	}

	.content {
		background-color: hsl(0, 0%, 0%);
		padding: 0.75em;
	}
`
