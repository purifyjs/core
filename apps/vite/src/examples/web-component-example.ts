import { Builder, ref, tags, WithLifecycle } from "@purifyjs/core";

const { div, button } = tags;

function App() {
	return div().id("app").children(new CounterElement());
}

declare global {
	interface HTMLElementTagNameMap {
		"x-counter": CounterElement;
	}
}

class CounterElement extends WithLifecycle(HTMLElement) {
	static _ = customElements.define("x-counter", CounterElement);

	#count = ref(0);

	constructor() {
		super();
		const self = new Builder<CounterElement>(this);

		self.children(
			button()
				.title("Click me!")
				.onclick(() => this.#count.val++)
				.children("Count:", this.#count),
		);
	}
}

document.body.append(App().node);
