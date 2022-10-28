import { ref, tags } from "@purifyjs/core";

const { p } = tags;

export function PageTitle() {
	const host = p();

	const pageTitle = ref("");
	host.element.onConnect(() => {
		pageTitle.val = document.title;
	});

	return host.children(pageTitle);
}
