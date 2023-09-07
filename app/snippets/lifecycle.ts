import { onConnected$ } from "@/../lib/core"

const myNode = document.createComment("hello")
onConnected$(myNode, () => {
	console.log(myNode, "Connected to the DOM")
	return () => console.log(myNode, "Disconnected from the DOM")
})
