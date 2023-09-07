import { fragment } from "@/../lib/core"
import { css } from "@/../lib/extra/css"
import { defineCustomTag } from "@/../lib/extra/custom-tags"
import { html } from "@/../lib/extra/html"
import { commonStyle } from "@/styles"

const demoTag = defineCustomTag("x-demo")
export function DemoWrapper() {
	const host = demoTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, style)

	dom.append(
		fragment(html`
			<div class="content">
				<slot></slot>
			</div>
		`)
	)

	return host
}

const style = css`
	:host {
		display: grid;
		padding-block: 0.5em;
	}

	.content {
		background-color: hsl(0, 0%, 0%);
		padding: 0.75em;
	}
`
