import { marked } from "marked"
import { fragment, populate, tagsNS } from "master-ts/core.ts"
import { css } from "master-ts/extra/css.ts"
import { defineCustomTag } from "master-ts/extra/custom-tags.ts"
import { html } from "master-ts/extra/html.ts"
import { Codeblock } from "./components/codeblock.ts"
import { DemoWrapper } from "./components/demo.ts"
import { Heading } from "./components/heading.ts"
import * as docNS from "./doc.ts"
import { parseDocumentation, type ParseDocumentation } from "./libs/parser.ts" assert { type: "macro" }
import { inlineRaw } from "./macros/read.ts" assert { type: "macro" }
import { commonStyle } from "./styles.ts"

const { section } = tagsNS

const docsTag = defineCustomTag("x-docs")
export function Docs() {
	const host = docsTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, documentStyle)

	dom.append(
		fragment(
			html`
				<div class="content">
					${parseDocumentation(inlineRaw("./apps/docs/src/doc.ts")).map((item) => renderItem(item))}
				</div>
			`
		)
	)

	return host
}

const markdownTag = defineCustomTag("x-markdown")
function renderItem(item: ParseDocumentation.Item, parentId = "", depth = 0): Node {
	switch (item.type) {
		case "region": {
			const id = `${parentId}/${item.name.replace(/\s+/g, "-").toLowerCase()}`
			return section(
				{ class: "region" },
				Heading(tagsNS[`h${1 + depth}`]!({}, item.name) as HTMLHeadingElement, id),
				...item.items.map((item) => renderItem(item, id, depth + 1))
			)
		}
		case "comment": {
			const el = markdownTag()
			el.innerHTML = marked.parse(item.content)
			el.querySelectorAll("a").forEach((a) => {
				if (a.href.startsWith(`${location.protocol}//${location.host}`)) return
				a.setAttribute("target", "_blank")
				a.setAttribute("rel", "noopener noreferrer")
			})
			return el
		}
		case "code":
			return Codeblock(item.content)
		case "demo": {
			return fragment(
				Codeblock(item.content),
				populate(DemoWrapper(), {}, docNS[item.name as keyof typeof docNS]())
			)
		}
		default:
			item satisfies never
			throw new Error("Unknown item type")
	}
}

export const documentStyle = css`
	:is(h1, h2, h3, h4, h5, h6) {
		text-wrap: balance;

		&:first-child {
			margin-block-start: 0;
		}
	}

	section {
		margin-block-start: 1em;

		& + section {
			margin-block-start: 5em;
		}
		&:has(+ section) {
			margin-block-end: 5em;
		}

		&:has(> :is(h2, h3, h4, h5, h6):first-child) {
			padding: 0.4em;
			border-left: 0.1em solid var(--primary);
		}
	}

	section > .active:first-child {
		text-decoration: underline;
	}

	a {
		color: var(--primary);
	}

	p {
		color: hsl(0, 0%, 95%);
	}

	:not(pre) > code {
		font-style: monospace;
		font-size: 1.25em;
		letter-spacing: 1;
		background-color: hsl(0, 0%, 25%);
		color: var(--secondary);
		padding-inline: 0.1ch;
	}
`
