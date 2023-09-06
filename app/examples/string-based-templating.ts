import { html } from "../../lib/extra/html"

html`
	<div class="hello" on:click=${() => alert("Hello World")}>
		Hello <span>World</span>
	</div>
`
