import { fragment, tagsNS } from "../lib/core"
import { css } from "../lib/extra/css"
import { defineCustomTag } from "../lib/extra/custom-tags"
import { html } from "../lib/extra/html"
import { Codeblock } from "./components/codeblock"
import { Heading } from "./components/heading"
import { Snippet } from "./components/snippet"

const { h2, h3, h4 } = tagsNS

const docsTag = defineCustomTag("x-docs")
export async function Docs() {
	const host = docsTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(documentStyle)

	dom.append(
		fragment(html`
			<div class="content">
				<section>
					<x ${Heading(h2(), "install")}>Install</x>
					<p>
						To install master-ts follow the
						<a href="https://github.com/DeepDoge/master-ts/releases" target="_blank" rel="noopener noreferrer">
							Installation Instructions
						</a>
					</p>
				</section>

				<section>
					<x ${Heading(h2(), "usage")}>Usage</x>

					<section>
						<x ${Heading(h3(), "templates")}>Templates</x>

						<p>
							In <strong>master-ts</strong>, there are two primary ways to define templates for your content.
							Both approaches serve the same purpose of structuring and rendering your HTML elements but offer
							different syntax options. You can choose the one that best fits your coding style and project
							requirements.
						</p>

						${await Snippet("templates/function-based-templating", h4({}, "Function-Based Template:"))}
						${await Snippet("templates/string-based-templating", h4({}, "Tagged Template Literal:"))}

						<x ${Heading(h3(), "template-helpers")}>Template Helpers</x>

						${await Snippet("populate", h4({}, "Populate:"))}

						<x ${Heading(h4(), "template-helpers/fragment")}>Fragment:</x>
						<x ${Codeblock(await import("./snippets/fragment?raw").then((m) => m.default))}></x>
						<p>
							You can convert any template content into <code>DocumentFragment</code> using
							<code>fragment()</code> function like shown above. Then you can easily append any template content
							to anywhere in the DOM.
						</p>
					</section>

					<section>
						<x ${Heading(h3(), "life-cycle")}>Life Cycle</x>
						<p>
							You can observe if a <code>Node</code> is connected to DOM or not using
							<code>onConnected$()</code> function. When a function has <code>$</code> at the end of it's name,
							that means that function is being binded to a <code>Node</code>'s lifecycle.
						</p>
						<x ${Codeblock(await import("./snippets/lifecycle?raw").then((m) => m.default))}></x>
					</section>

					<section>
						<x ${Heading(h3(), "signals")}>Signals</x>
						<p>
							In the world of <strong>master-ts</strong>, reactivity is made possible through the seamless
							integration of signals. Signals serve a dual purpose: they allow for the observation of value
							changes and enable efficient DOM manipulations.
						</p>

						<x ${Heading(h4(), "signals/create")}>Create:</x>
						<p>In the code below, we create a <code>${"Signal<string>"}</code>, and then mutate it.</p>
						<x ${Codeblock(await import("./snippets/create-signal?raw").then((m) => m.default))}></x>

						<x ${Heading(h4(), "signals/follow")}>Follow:</x>
						<p>
							After following a signal manually, if you don't wanna follow the signal until the App exits, you
							have to unfollow it manually
						</p>
						<x ${Codeblock(await import("./snippets/follow-signal?raw").then((m) => m.default))}></x>

						<x ${Heading(h4(), "signals/bind-follow")}>Bind Follow:</x>
						<p>
							You can bind a follow to a life cycle of a <code>Node</code>. This way you don't have to unfollow
							manually. This follows naming convention mentioned in <a href="#life-cycle">Life Cycle</a> section.
						</p>
						<p>The code below will do two things:</p>
						<ol>
							<li>When <code>myNode</code> is connected to DOM, it will follow the signal</li>
							<li>When <code>myNode</code> is disconnected from DOM, it will unfollow the signal</li>
						</ol>
						<x ${Codeblock(await import("./snippets/bind-follow?raw").then((m) => m.default))}></x>
					</section>
				</section>
			</div>
		`)
	)

	return host
}

export const documentStyle = await css`
	section {
		margin-block: 2.5em;
		& + section {
			margin-block-start: 5em;
		}
		&:has(+ section) {
			margin-block-end: 5em;
		}
	}

	a {
		color: var(--primary);
	}

	p {
		color: hsl(0, 0%, 95%);
	}

	:not(pre) > code {
		font-style: monospace;
		background-color: hsl(0, 0%, 25%);
		color: var(--secondary);
		padding-inline: 0.1ch;
		font-size: 0.8em;
	}
`
