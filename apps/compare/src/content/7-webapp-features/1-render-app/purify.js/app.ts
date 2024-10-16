import { tags } from "@purifyjs/core";

const { div, h1 } = tags;

export function App() {
	return div().id("app").children(h1().children("Hello World"));
}

document.body.append(App().element);
