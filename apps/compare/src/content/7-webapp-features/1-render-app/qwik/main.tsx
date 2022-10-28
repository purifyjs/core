import { render } from "@builder.io/qwik";
import "@builder.io/qwik/qwikloader.js";
import { App } from "./app.tsx";

render(
	document.getElementById("app") as HTMLElement,
	<App />,
);
