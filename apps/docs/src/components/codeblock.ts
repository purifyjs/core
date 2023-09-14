import "../libs/prism"

import { fragment } from "master-ts/core.ts"
import { css } from "master-ts/extra/css.ts"
import { defineCustomTag } from "master-ts/extra/custom-tags.ts"
import { html } from "master-ts/extra/html.ts"
import { inlineRaw } from "../macros/read.ts" assert { type: "macro" }
import { commonStyle } from "../styles.ts"

const { Prism } = window

const prismThemeStyle = css`
	${inlineRaw("./apps/docs/src/libs/prism/style.css")}
`

const codeblockTag = defineCustomTag("x-codeblock")
export function Codeblock(code: string) {
	const host = codeblockTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, prismThemeStyle, style)

	dom.append(
		fragment(html`
			<div class="code">
				<pre><code></code></pre>
			</div>
		`)
	)

	dom.querySelector("code")!.innerHTML = Prism.highlight(clearCode(code), Prism.languages["js"]!, "typescript")

	return host
}

const style = css`
	:host {
	}

	.code {
		display: grid;
		grid-template-columns: 1fr;
		overflow-x: auto;

		padding: 0.5em;
		font-family: monospace;
		tab-size: 3;
		font-size: 1.15em;
		background-color: #121212;
	}

	pre {
		max-width: 0;
		margin: 0;
		line-height: 1.5;
		letter-spacing: 0.025rem;
	}
`

function clearCode(code: string) {
	// Split the code into lines
	const lines = code.split("\n")

	// Remove empty lines from the beginning and end
	while (lines.length > 0 && !lines.at(0)!.trim()) {
		lines.shift() // Remove the first line if it's empty
	}
	while (lines.length > 0 && !lines.at(-1)!.trim()) {
		lines.pop() // Remove the last line if it's empty
	}

	// Find the minimum number of leading spaces or tabs
	let minIndent = Infinity
	for (const line of lines) {
		if (!line.trim()) continue // Skip empty lines
		const leadingWhitespace = line.match(/^\s*/)![0]
		const indentSize = leadingWhitespace.length
		if (indentSize < minIndent) {
			minIndent = indentSize
		}
	}

	// Remove the minimum indent from each line
	const formattedCode = lines.map((line) => (line.length >= minIndent ? line.slice(minIndent) : line)).join("\n")

	return formattedCode
}
