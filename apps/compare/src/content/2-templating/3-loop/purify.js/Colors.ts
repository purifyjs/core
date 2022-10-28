import { tags } from "@purifyjs/core";

const { ul, li } = tags;

const colors = ["red", "green", "blue"] as const;
export function Colors() {
	return ul().children(
		colors.map((color) => li().textContent(color)),
	);
}
