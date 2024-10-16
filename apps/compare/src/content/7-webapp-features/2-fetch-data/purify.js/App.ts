import { awaited, computed, fragment, tags } from "@purifyjs/core";
import { fetchUsers } from "./fetchUsers";

const { p, ul, li, img } = tags;

export function App() {
	const response = awaited(
		fetchUsers().catch((error) =>
			error instanceof Error ? error : new Error(String(error)),
		),
		null,
	);

	return fragment(
		computed(() => {
			if (!response.val) {
				return p().children("Fetching users...");
			} else if (response.val instanceof Error) {
				return p().children(
					"An error occurred while fetching users",
				);
			} else {
				return ul().children(
					response.val.map((user) =>
						li().children(
							img().src(user.picture.thumbnail),
							p().children(
								user.name.first,
								user.name.last,
							),
						),
					),
				);
			}
		}),
	);
}
