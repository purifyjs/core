import { Lifecycle } from "@purifyjs/core";

declare global {
	interface DOMStringMap {
		scope?: string;
	}
}

export const css = String.raw;

export function sheet(css: string) {
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(css);
	return sheet;
}

export function scope(css: string): Lifecycle.OnConnected {
	return (element) => {
		if (element.dataset.scope) return;

		const scopeId = Math.random().toString(36).slice(2);
		document.adoptedStyleSheets.push(
			sheet(
				`@scope ([data-scope="${scopeId}"]) to ([data-scope]:not([data-scope="${scopeId}"]) > *) {${css}}`,
			),
		);
		element.dataset.scope = scopeId;
	};
}
