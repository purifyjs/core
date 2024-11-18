import { Lifecycle, Signal } from "@purifyjs/core";

export function useBindText(
	signal: Signal.State<string>,
): Lifecycle.OnConnected<HTMLInputElement> {
	return (element) => {
		const listener = () => (signal.val = element.value);
		element.addEventListener("input", listener);

		const unfollow = signal.follow(
			(value) => (element.value = value),
			true,
		);

		return () => {
			unfollow();
			element.removeEventListener("input", listener);
		};
	};
}
