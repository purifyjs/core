import { tags } from "@purifyjs/core";

const { div, p } = tags;

export function UserProfile({
	name = "",
	age = 0,
	favouriteColors = [] as string[],
	isAvailable = false,
}) {
	return div().children(
		p().children("My name is ", name),
		p().children("My age is ", age),
		p().children(
			"My favourite colors are ",
			favouriteColors.join(", "),
		),
		p().children(
			"I am ",
			isAvailable ? "available" : "not available",
		),
	);
}
