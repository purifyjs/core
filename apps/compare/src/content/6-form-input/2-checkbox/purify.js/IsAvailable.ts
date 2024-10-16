import { fragment, ref, tags } from "@purifyjs/core";

const { label, input } = tags;

export function InputHello() {
	const isAvailable = ref(false);

	return fragment(
		input()
			.id("is-available")
			.type("checkbox")
			.checked(isAvailable)
			.onchange(
				(event) =>
					(isAvailable.val = event.currentTarget.checked),
			),
		label({ for: "is-available" }).children("Is available"),
	);
}
