import { computed, ref, tags } from "@purifyjs/core";

const { div } = tags;

export function DoubleCount() {
	const count = ref(10);
	const doubleCount = computed(() => count.val * 2);

	return div().children(doubleCount);
}
