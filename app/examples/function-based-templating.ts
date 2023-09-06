import { tagsNS } from "../../lib/core"

const { div, span } = tagsNS

div(
	{ class: "hello", "on:click": () => alert("Hello World") },
	"Hello",
	span({}, "World")
)
