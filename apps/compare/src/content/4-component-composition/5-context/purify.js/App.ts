import { fragment, ref, tags } from "@purifyjs/core";
import { UserProfile } from "./UserProfile";

export type User = {
	id: number;
	username: string;
	email: string;
};
function createUserState(initial: User) {
	const username = ref(initial.username);
	return {
		...initial,
		get username() {
			return username.val;
		},
		updateUsername(value: string) {
			username.val = value;
		},
	};
}
export const userState = createUserState({
	id: 1,
	username: "Alice",
	email: "alice@example.com",
});

const { h1 } = tags;

export function App() {
	return fragment(
		h1().children(
			`Welcome back, ${userState.username}`,
		),
		UserProfile(),
	);
}
