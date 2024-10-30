import { ref, tags } from "@purifyjs/core";

const { p } = tags;

export function PageTitle() {
	const pageTitle = ref("");

	return p()
		.effect(() => {
			pageTitle.val = document.title;
		})
		.children(pageTitle);
}
