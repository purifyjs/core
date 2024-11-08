import { Lifecycle } from "@purifyjs/core";

declare global {
	interface DOMStringMap {
		scope?: string;
	}
}

export function css(...params: Parameters<typeof String.raw>) {
	return new String(String.raw(...params));
}

export function sheet(css: string) {
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(css);
	return sheet;
}

const scopedCssCache = new WeakMap<
	String,
	{ styleSheet: CSSStyleSheet; id: string }
>();
export function useScope(css: String): Lifecycle.OnConnected {
	return (element) => {
		if (element.dataset.scope) return;

		let cache = scopedCssCache.get(css);
		if (!cache) {
			const id = Math.random().toString(36).slice(2);
			const styleSheet = sheet(
				`@scope ([data-scope="${id}"]) to ([data-scope] > *) {${css}}`,
			);
			cache = { id, styleSheet };
			scopedCssCache.set(css, cache);
		}

		element.dataset.scope = cache.id;
		document.adoptedStyleSheets.push(cache.styleSheet);
	};
}
