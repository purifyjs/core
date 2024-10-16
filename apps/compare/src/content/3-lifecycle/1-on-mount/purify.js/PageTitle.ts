import { ref, tags } from "@purifyjs/core";

const { p } = tags;

export function PageTitle() {
	const pageTitle = ref("");

	return p()
		.use(() => {
			pageTitle.val = document.title;
		})
		.children(pageTitle);
}
