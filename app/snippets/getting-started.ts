import type { Signal } from "@/../lib/core"
import { signal } from "@/../lib/core"
import { html } from "@/../lib/extra/html"

export function Hello() {
	const world = signal("world")
	const color = signal("red")

	return html`
		<div class="hello">
			<input bind:value=${world} />
			<input bind:value=${color} />
			<div style:color=${color} style-font-weight="bold">Hello ${world}</div>
		</div>
		<div class="counter">${Counter()}</div>
	`
}

function Counter(count: Signal<number> = signal(0)) {
	const double = () => count.ref * 2

	return html`
		<button on:click=${() => count.ref++}>Click me: ${count}</button>
		<div>Double: ${double}</div>
	`
}
