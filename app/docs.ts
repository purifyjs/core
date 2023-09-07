import { fragment, tagsNS } from "../lib/core"
import { css } from "../lib/extra/css"
import { defineCustomTag } from "../lib/extra/custom-tags"
import { html } from "../lib/extra/html"
import { Heading } from "./components/heading"
import { Snippet } from "./components/snippet"
import snipped_lifecycle from "./snippets/lifecycle.ts?raw"
import snipped_signals_bind_follow from "./snippets/signals/bind-follow.ts?raw"
import snipped_signals_create from "./snippets/signals/create.ts?raw"
import snipped_signals_follow from "./snippets/signals/follow.ts?raw"
import snipped_templates_fragment from "./snippets/templates/fragment.ts?raw"
import snipped_templates_function from "./snippets/templates/function-based-templating.ts?raw"
import snipped_templates_populate from "./snippets/templates/populate.ts?raw"
import snipped_templates_string from "./snippets/templates/string-based-templating.ts?raw"
import { commonStyle } from "./styles"

const { h2, h3, h4 } = tagsNS

const docsTag = defineCustomTag("x-docs")
export function Docs() {
	const host = docsTag()
	const dom = host.attachShadow({ mode: "open" })
	dom.adoptedStyleSheets.push(commonStyle, documentStyle)

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

						<x ${Heading(h4(), "templates/function")}>Function-Based Template:</x>
						${Snippet(snipped_templates_function)}

						<x ${Heading(h4(), "templates/string")}>Tagged Template Literal:</x>
						${Snippet(snipped_templates_string)}

						<x ${Heading(h3(), "template-helpers")}>Template Helpers</x>

						<x ${Heading(h4(), "populate")}>Populate:</x>
						${Snippet(snipped_templates_populate)}

						<x ${Heading(h4(), "template-helpers/fragment")}>Fragment:</x>
						${Snippet(snipped_templates_fragment)}
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
						${Snippet(snipped_lifecycle)}
					</section>

					<section>
						<x ${Heading(h3(), "signals")}>Signals</x>
						<p>
							In the world of <strong>master-ts</strong>, reactivity is made possible through the seamless
							integration of signals. Signals serve a dual purpose: they allow for the observation of value
							changes and enable efficient DOM manipulations.
						</p>

						<section>
							<x ${Heading(h4(), "signals/create")}>Create:</x>
							<p>In the code below, we create a <code>${"Signal<string>"}</code>, and then mutate it.</p>
							${Snippet(snipped_signals_create)}
						</section>

						<section>
							<x ${Heading(h4(), "signals/follow")}>Follow:</x>
							<p>
								After following a signal manually, if you don't wanna follow the signal until the App exits, you
								have to unfollow it manually
							</p>
							${Snippet(snipped_signals_follow)}
						</section>

						<section>
							<x ${Heading(h4(), "signals/bind-follow")}>Bind Follow:</x>
							<p>
								You can bind a follow to a life cycle of a <code>Node</code>. This way you don't have to
								unfollow manually. This follows naming convention mentioned in
								<a href="#life-cycle">Life Cycle</a> section.
							</p>
							<p>The code below will do two things:</p>
							<ol>
								<li>When <code>myNode</code> is connected to DOM, it will follow the signal</li>
								<li>When <code>myNode</code> is disconnected from DOM, it will unfollow the signal</li>
							</ol>
							${Snippet(snipped_signals_bind_follow)}
						</section>
					</section>
				</section>
			</div>
		`)
	)

	return host
}

export const documentStyle = await css`
	:is(h1, h2, h3, h4, h5, h6):first-child {
		margin-block-start: 0;
	}

	section {
		padding: 1ch;
		border-left: 0.25rem solid var(--primary);
		& + section {
			margin-block-start: 5em;
		}
		&:has(+ section) {
			margin-block-end: 5em;
		}
	}

	section > .active:first-child {
		text-decoration: underline;
	}

	section {
		position: relative;

		& > h2:first-child {
			position: sticky;
			top: 0;
			background-color: var(--body);
			padding-block: 0.5em;
			margin: 0;
			z-index: 2;
		}

		& > h3:first-child {
			position: sticky;
			top: 3rem;
			background-color: var(--body);
			padding-block: 0.5em;
			margin: 0;
			z-index: 1;
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
		font-size: inherit;
		letter-spacing: 1;
		background-color: hsl(0, 0%, 25%);
		color: var(--secondary);
		padding-inline: 0.1ch;
	}
`
