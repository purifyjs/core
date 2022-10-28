import { fragment, ref, tags } from "@purifyjs/core";
import { bind } from "./util-bind";

const { p, input } = tags;

export function InputHello() {
	const text = ref("Hello World");

	return fragment(
		p().children(text),
		input().use(bind(text, "value", "input")),
	);
}
