import {
	computed,
	fragment,
	ref,
	tags,
} from "@purifyjs/core";

const { div, input, label } = tags;

export function PickPill() {
	const picked = ref<"red" | "blue">("red");

	return fragment(
		div().children("Picked: ", picked),
		input()
			.id("blue-pill")
			.type("radio")
			.checked(computed(() => picked.val === "blue"))
			.onchange(() => (picked.val = "blue")),
		label({ for: "blue-pill" }).children("Blue pill"),
		input()
			.id("red-pill")
			.type("radio")
			.checked(computed(() => picked.val === "red"))
			.onchange(() => (picked.val = "red")),
		label({ for: "red-pill" }).children("Red pill"),
	);
}
