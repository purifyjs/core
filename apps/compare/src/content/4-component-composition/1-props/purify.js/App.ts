import { tags } from "@purifyjs/core";
import { UserProfile } from "./UserProfile";

const { div } = tags;

export function App() {
	return div()
		.id("app")
		.children(
			UserProfile({
				name: "John",
				age: 30,
				favouriteColors: ["red", "green", "blue"],
				isAvailable: true,
			}),
		);
}
