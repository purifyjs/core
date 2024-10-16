import { fragment, ref, tags } from "@purifyjs/core";

const { p, input } = tags;

export function InputHello() {
	const text = ref("Hello World");

	return fragment(
		p().children(text),
		input()
			.value(text)
			.oninput(
				(event) => (text.val = event.currentTarget.value),
			),
	);
}
