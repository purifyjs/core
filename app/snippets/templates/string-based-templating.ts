import { html } from "../../../lib/extra/html"

html`
	<div class="hello" on:click=${() => alert("Hello World")}>
		Hello <span>World</span>
	</div>
`

/* 
In example above, you import `html`, and you use a tagged template literal syntax to define your HTML structure.
This approach allows you to write HTML-like code within a template string and use `${}` to insert dynamic values or
expressions. It's more akin to writing HTML directly with embedded JavaScript expressions. One important point is
a tagged template literal will always returns an array of contents. The code above will return the array `[HTMLDivElement]`.
*/

/* 
One important point is a tagged template literal will always returns an array of contents. 
The code above will return the array `[HTMLDivElement]`.
*/
