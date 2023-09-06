import { fragment, tagsNS } from "@/../lib/core"
import { css } from "@/../lib/extra/css"
import { html } from "@/../lib/extra/html"
import { Codeblock } from "./codeblock"
import { Heading } from "./heading"
import { IPFS } from "./libs/ipfs"

const { div, h2, h3, h4 } = tagsNS

document.adoptedStyleSheets.push(css`
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
`)

async function App() {
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

			<x ${Heading(h2(), "install")}>Install</x>
			<p>
				To install master-ts follow the
				<a href="https://github.com/DeepDoge/master-ts/releases" target="_blank" rel="noopener noreferrer">
					Installation Instructions
				</a>
			</p>

			<x ${Heading(h2(), "usage")}>Usage</x>

			<x ${Heading(h3(), "templates")}>Templates</x>

			<p>
				In <strong>master-ts</strong>, there are two primary ways to define templates for your content. Both
				approaches serve the same purpose of structuring and rendering your HTML elements but offer different syntax
				options. You can choose the one that best fits your coding style and project requirements.
			</p>

			<x ${Heading(h4(), "templates/function-based-templating")}>Function-Based Template:</x>
			<x ${Codeblock(await import("./examples/function-based-templating?raw").then((m) => m.default))}></x>
			<p>
				In the example above, you import <code>tagsNS</code> proxy, and you destructure <code>div</code> and
				<code>span</code> from it. You then create the DOM elements using a function call and provide the element's
				attributes, directives, and content as arguments. This approach is more function-oriented and requires you
				to explicitly call functions to create elements.
			</p>

			<x ${Heading(h4(), "templates/string-based-templating")}>Tagged Template Literal:</x>
			<x ${Codeblock(await import("./examples/string-based-templating?raw").then((m) => m.default))}></x>
			<p>
				In example above, you import <code>html</code>, and you use a tagged template literal syntax to define your
				HTML structure. This approach allows you to write HTML-like code within a template string and use \${} to
				insert dynamic values or expressions. It's more akin to writing HTML directly with embedded JavaScript
				expressions.
			</p>
			<p>
				One important point is a tagged template literal will always returns an array of contents. The code above
				will return the array <code>[HTMLDivElement]</code>.
			</p>

			<x ${Heading(h3(), "template-helpers")}>Template Helpers</x>

			<x ${Heading(h4(), "template-helpers/populate")}>Populate:</x>
			<x ${Codeblock(await import("./examples/populate?raw").then((m) => m.default))}></x>
			<p>
				You can also use <code>populate()</code> to populate an already exisiting DOM element with attributes,
				directives, and content.
			</p>

			<x ${Heading(h4(), "template-helpers/fragment")}>Fragment:</x>
			<x ${Codeblock(await import("./examples/fragment?raw").then((m) => m.default))}></x>
			<p>
				You can convert any template content into <code>DocumentFragment</code> using
				<code>fragment()</code> function like shown above. Then you can easily append any template content to
				anywhere in the DOM.
			</p>

			<x ${Heading(h3(), "life-cycle")}>Life Cycle</x>
			<p>
				You can observe if a <code>Node</code> is connected to DOM or not using
				<code>onConnected$()</code> function. When a function has <code>$</code> at the end of it's name, that means
				that function is being binded to a <code>Node</code>'s lifecycle.
			</p>
			<x ${Codeblock(await import("./examples/lifecycle?raw").then((m) => m.default))}></x>

			<x ${Heading(h3(), "signals")}>Signals</x>
		`)
	)

	return host
}

const style = css`
	:host {
		display: grid;
		grid-auto-flow: row;
		padding-block-end: 25vh;
	}

	img {
		max-width: 100%;
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

	header {
		display: grid;
		grid-auto-flow: row;
		justify-items: center;
		text-align: center;
	}

	a {
		color: var(--primary);
	}

	p {
		color: hsl(0, 0%, 95%);
	}

	code {
		font-style: monospace;
		background-color: hsl(0, 0%, 25%);
		color: var(--secondary);
	}
`

document.body.append(await App())
