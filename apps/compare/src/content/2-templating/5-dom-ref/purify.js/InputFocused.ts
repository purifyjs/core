import { Lifecycle, tags } from "@purifyjs/core";

const { input } = tags;

export function InputFocused() {
	return input().effect(useAutoFocus()).type("text");
}

export function useAutoFocus(): Lifecycle.OnConnected {
	return (element) => element.focus();
}
