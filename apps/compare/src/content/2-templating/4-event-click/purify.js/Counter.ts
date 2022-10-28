import { fragment, ref, tags } from "@purifyjs/core";

const { p, button } = tags;

export function Counter() {
	const count = ref(0);

	function incrementCount() {
		count.val++;
	}

	return fragment(
		p().children("Counter: ", count),
		button().onclick(incrementCount).children("+1"),
	);
}
