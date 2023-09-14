import "./styles.ts"

import { fragment } from "master-ts/core.ts"
import { css } from "master-ts/extra/css.ts"
import { defineCustomTag } from "master-ts/extra/custom-tags.ts"
import { html } from "master-ts/extra/html.ts"
import { Docs } from "./content.ts"
import { IPFS } from "./libs/ipfs.ts"
import { commonStyle } from "./styles.ts"

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
					A lightweight TypeScript library designed for creating SPAs, that is complementary to the browser's
					native APIs. Small yet powerful. Simple yet still useful.
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

	header {
		display: grid;
		grid-auto-flow: row;
		text-align: center;
	}

	.logo {
		position: relative;
		isolation: isolate;

		& > img,
		&::before {
			width: min(25em, 100%);
			aspect-ratio: 4 / 3;
		}

		& > img {
			object-fit: contain;
		}

		&::before {
			content: "";
			position: absolute;
			background: conic-gradient(from 30deg, var(--primary), var(--secondary), var(--primary));
			border-radius: 1000000px;
			filter: blur(100px);
			opacity: 0.25;
			z-index: -1;
		}
	}
`

document.body.append(App())
