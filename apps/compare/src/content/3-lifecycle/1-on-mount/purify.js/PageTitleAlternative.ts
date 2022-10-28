import { fragment, ref, tags } from "@purifyjs/core";

const { p } = tags;

export function PageTitleAlternative() {
	const host = p();
	const shadow = host.element.attachShadow({
		mode: "open",
	});
	shadow.append(fragment(title));
	return host;
}

const title = ref("", (set) => {
	document.title ||= "";
	const titleElement = document.querySelector("title")!;

	const observer = new MutationObserver((mutations) =>
		set(mutations[0].target.nodeValue ?? ""),
	);

	observer.observe(titleElement, {
		subtree: true,
		characterData: true,
		childList: true,
	});

	set(document.title);

	return () => {
		observer.disconnect();
	};
});
