import { Lifecycle, tags } from "@purifyjs/core";

const { input } = tags;

export function InputFocused() {
	return input().use(autoFocus()).type("text");
}

export function autoFocus(): Lifecycle.OnConnected {
	return (element) => element.focus();
}
