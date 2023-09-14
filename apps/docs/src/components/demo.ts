import { fragment } from "master-ts/core.ts"
import { css } from "master-ts/extra/css.ts"
import { defineCustomTag } from "master-ts/extra/custom-tags.ts"
import { html } from "master-ts/extra/html.ts"
import { commonStyle } from "../styles.ts"

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
