import { commonStyle } from "@/app/styles.ts"
import { fragment } from "@/lib/core.ts"
import { css } from "@/lib/extra/css.ts"
import { defineCustomTag } from "@/lib/extra/custom-tags.ts"
import { html } from "@/lib/extra/html.ts"

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

export type Test = {}
