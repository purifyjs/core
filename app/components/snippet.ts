import { fragment, tagsNS } from "@/../lib/core"
import { marked } from "marked"
import { html } from "../../lib/extra/html"
import { Codeblock } from "./codeblock"
import { Heading } from "./heading"

const { div } = tagsNS

export async function Snippet(path: string, headingHost?: HTMLHeadingElement) {
	const snippet = await import(`../snippets/${path}?raw`).then((m) => parseSnippet(m.default))
	const content = snippet.map((item) => {
		if (item.type === "comment") {
			const parent = div()
			parent.innerHTML = marked.parse(item.text)
			return parent
		} else if (item.type === "code") {
			return Codeblock(item.text)
		} else {
		}
	})

	return fragment(html` ${headingHost ? html`<x ${Heading(headingHost, path)}></x>` : null} ${content} `)
}

function parseSnippet(code: string) {
	type CommentOrCode = { type: "comment"; text: string } | { type: "code"; text: string }
	const lines: string[] = code
		.trim()
		.split("\n")
		.filter((line) => !line.trim().startsWith("import "))
	const result: CommentOrCode[] = []
	let currentBlock: string | null = null

	for (let line of lines) {
		if (line.trim().startsWith("/*")) {
			line = line.trim().slice(2).trim()
			// If we encounter a line starting with "/*", start a new comment block
			currentBlock = line + "\n"
		} else if (currentBlock !== null) {
			// If we're inside a comment block, continue adding lines to it
			currentBlock += line + "\n"

			// If we encounter a line ending with "*/", consider the comment block complete
			if (line.trim().endsWith("*/")) {
				result.push({ type: "comment", text: currentBlock.slice(0, -3).trim() })
				currentBlock = null
			}
		} else if (line.trim()) {
			// If we're not inside a comment block, add the line as code
			if (result.at(-1)?.type === "code") result.at(-1)!.text += "\n" + line
			else result.push({ type: "code", text: line })
		}
	}

	return result
}
