import "./styles"

import { fragment } from "@/../lib/core"
import { css } from "@/../lib/extra/css"
import { html } from "@/../lib/extra/html"
import { defineCustomTag } from "../lib/extra/custom-tags"
import { Docs } from "./content"
import { IPFS } from "./libs/ipfs"
import { commonStyle } from "./styles"

const appTag = defineCustomTag("x-app")
function App() {
	const host = appTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, style)

	dom.append(
		fragment(html`
			<header>
				<div class="logo">
					<img alt="master-ts logo" src=${IPFS.resolve("QmRZXurxmTZwQC2GPrdNidPJ3PS4SrXSFqkeeoV24DXt4e")} />
				</div>
				<h1 style:position="absolute" style:scale="0">master-ts</h1>
				<p>
					A lightweight TypeScript library designed for creating Single Page Applications (SPAs) that supercharge
					vanilla JS. This lightweight library introduces powerful features, including a robust signaling system
					and seamless templating with full support for signals.
				</p>
			</header>
			<main>
				<x ${Docs()} class="docs"></x>
			</main>
		`)
	)

	return host
}

const style = css`
	:host {
		display: grid;
		grid-auto-flow: row;
		grid-template-columns: minmax(0, 60em);
		justify-content: center;
		padding-block-end: 25vh;
	}

	img {
		max-width: 100%;
	}

	header {
		display: grid;
		grid-auto-flow: row;
		justify-items: center;
		text-align: center;
	}

	.logo {
		position: relative;
		isolation: isolate;

		&::before {
			content: "";
			position: absolute;
			inset: 0;
			background: conic-gradient(from 30deg, var(--primary), var(--secondary), var(--primary));
			border-radius: 1000000px;
			filter: blur(100px);
			opacity: 0.25;
			z-index: -1;
		}
	}
`

document.body.append(App())