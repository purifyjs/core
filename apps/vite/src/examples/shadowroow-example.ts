import { fragment, ref, tags } from "@purifyjs/core";

const { div, button } = tags;

function App() {
	return div().id("app").children(Counter());
}

function Counter() {
	const host = div();
	const shadow = host.element.attachShadow({ mode: "open" });

	const count = ref(0);

	shadow.append(
		fragment(
			button()
				.title("Click me!")
				.onclick(() => count.val++)
				.children("Count:", count),
		),
	);
	return host;
}

document.body.append(App().element);
