import { tags } from "@purifyjs/core";
import { userState } from "./App";

const { div, h2, p, button } = tags;

export function UserProfile() {
	return div().children(
		h2().children("My Profile"),
		p().children("Username: ", userState.username),
		p().children("Email: ", userState.email),
		button()
			.onclick(() => {
				userState.updateUsername("Jane");
			})
			.children("Update username to Jane"),
	);
}
