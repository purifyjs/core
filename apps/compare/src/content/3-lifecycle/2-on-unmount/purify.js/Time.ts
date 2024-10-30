import { ref, tags } from "@purifyjs/core";

const { p } = tags;

export function Time() {
	const time = ref(new Date().toLocaleTimeString());

	return p()
		.effect(() => {
			const interval = setInterval(() => {
				time.val = new Date().toLocaleTimeString();
			}, 1000);
			return () => clearInterval(interval);
		})
		.children("Current time: ", time);
}
