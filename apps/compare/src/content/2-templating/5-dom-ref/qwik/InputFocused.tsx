import {
	component$,
	useRef,
	useVisibleTask$,
} from "@builder.io/qwik";

export const InputFocused = component$(() => {
	const inputElement = useRef(null);

	useVisibleTask$(() => inputElement.current.focus());

	return <input type="text" ref={inputElement} />;
});
