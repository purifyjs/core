import {
	computed,
	fragment,
	ref,
	tags,
} from "@purifyjs/core";

const { button, p, span } = tags;

const TRAFFIC_LIGHTS = ["red", "orange", "green"] as const;
export function TrafficsLight() {
	const lightIndex = ref(0);

	const light = computed(
		() => TRAFFIC_LIGHTS[lightIndex.val],
	);

	function nextLight() {
		lightIndex.val =
			(lightIndex.val + 1) % TRAFFIC_LIGHTS.length;
	}

	return fragment(
		button()
			.onclick(nextLight)
			.textContent("Next light"),
		p().children("Light is: ", light),
		p().children(
			"You must",
			computed(() => {
				if (light.val === "red")
					return span().textContent("STOP");
				else if (light.val === "orange")
					return span().textContent("SLOW DOWN");
				else if (light.val === "green")
					return span().textContent("GO");
				light.val satisfies never;
			}).derive(
				(result) =>
					result ?? span().textContent(light),
			),
		),
	);
}
