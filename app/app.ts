import { fragment, tagsNS } from "@/../lib/core"
import { css } from "@/../lib/extra/css"
import { html } from "@/../lib/extra/html"
import { awaited } from "../lib/extra/awaited"
import { Docs } from "./docs"
import { IPFS } from "./libs/ipfs"

const { div } = tagsNS

document.adoptedStyleSheets.push(
	await css`
		:root {
			font-family: "Open Sans Light", Helvetica;
			font-size: 0.75rem;
			line-height: 1.5;
			letter-spacing: 0.1rem;
			color-scheme: dark;
			scroll-behavior: smooth;
			text-rendering: optimizeLegibility;
			font-smooth: always;
		}

		:root {
			--primary: #eb3f33;
			--secondary: #a1e694;
		}
	`
)

function App() {
	const host = div()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(style)

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

			${awaited(Docs().then((docs) => html` <x ${docs} class="docs"></x> `))}
		`)
	)

	return host
}

const style = await css`
	:host {
		display: grid;
		grid-auto-flow: row;
		padding-block-end: 25vh;
	}

	* {
		margin: 0;
		padding: 0;
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

document.body.append(await App())
