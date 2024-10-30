import { fragment, ref, tags } from "@purifyjs/core";
import { useBind } from "./util-bind";

const { p, input } = tags;

export function InputHello() {
	const text = ref("Hello World");

	return fragment(
		p().children(text),
		input().effect(useBind(text, "value", "input")),
	);
}
