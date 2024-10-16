import { computed, fragment, ref, tags } from "@purifyjs/core";

const { select, option } = tags;

const colors = [
	{ id: 1, text: "red" },
	{ id: 2, text: "blue" },
	{ id: 3, text: "green" },
	{ id: 4, text: "gray", isDisabled: true },
];

export function PickPill() {
	const selectedColorId = ref(2);

	return fragment(
		select()
			.value(computed(() => String(selectedColorId.val)))
			.onchange(
				(event) =>
					(selectedColorId.val = Number(
						event.currentTarget.value,
					)),
			)
			.children(
				colors.map((color) =>
					option()
						.value(String(color.id))
						.disabled(Boolean(color.isDisabled))
						.textContent(color.text),
				),
			),
	);
}
