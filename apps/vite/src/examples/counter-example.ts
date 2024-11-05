import {
	computed,
	Lifecycle,
	ref,
	Signal,
	tags,
} from "@purifyjs/core";

const { div, section, button, ul, li, input } = tags;

function App() {
	return div().id("app").children(Counter());
}

function Counter() {
	const count = ref(0);
	const double = count.derive((count) => count * 2);
	const half = computed(() => count.val * 0.5);

	return div().children(
		section({ class: "input" })
			.ariaLabel("Input")
			.children(
				button()
					.title("Decrement by 1")
					.onclick(() => count.val++)
					.textContent("-"),
				input()
					.type("number")
					.effect(useBindNumber(count))
					.step("1"),
				button()
					.title("Increment by 1")
					.onclick(() => count.val++)
					.textContent("+"),
			),
		section({ class: "output" })
			.ariaLabel("Output")
			.children(
				ul().children(
					li().children("Count: ", count),
					li().children("Double: ", double),
					li().children("Half: ", half),
				),
			),
	);
}

function useBindNumber(
	state: Signal.State<number>,
): Lifecycle.OnConnected<HTMLInputElement> {
	return (element) => {
		const listener = () => (state.val = element.valueAsNumber);
		element.addEventListener("input", listener);
		const unfollow = state.follow(
			(value) => (element.valueAsNumber = value),
			true,
		);
		return () => {
			element.removeEventListener("input", listener);
			unfollow();
		};
	};
}

document.body.append(App().element);
