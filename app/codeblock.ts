import type { SignalOrValueOrFn } from "@/../lib/core"
import { derive, fragment, isSignalOrFn, signalFrom } from "@/../lib/core"
import { css } from "@/../lib/extra/css"
import { html } from "@/../lib/extra/html"
import { defineCustomTag } from "../lib/extra/custom-tags"
import "./libs/prism"
import prismThemeCss from "./libs/prism/style.css?inline"

const { Prism } = window

const prismThemeStyle = new CSSStyleSheet()
prismThemeStyle.replaceSync(prismThemeCss)

const codeblockTag = defineCustomTag("x-codeblock")
export function Codeblock(code: SignalOrValueOrFn<string>) {
	const host = codeblockTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(style)
	dom.adoptedStyleSheets.push(prismThemeStyle)

	const trimmedCode = derive(() => clearCode(isSignalOrFn(code) ? signalFrom(code).ref : code))

	trimmedCode.follow$(
		host,
		(code) => (dom.querySelector("code")!.innerHTML = Prism.highlight(code, Prism.languages["js"]!, "typescript")),
		{ mode: "immediate" }
	)

	dom.append(
		fragment(html`
			<div class="code">
				<pre><code></code></pre>
			</div>
		`)
	)

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
		tab-size: 4;
		font-size: 0.85em;
		background-color: hsl(0, 0%, 0%);
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
	const lines = code.split("\n").filter((line) => !line.trim().startsWith("import "))

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
