import { onConnected$, signal } from "@/../lib/core"

const myNode = document.createComment("myNode")
const mySignal = signal(123)

mySignal.follow$(myNode, (value) => {
	console.log(value)
})

/* Same as: */
onConnected$(
	myNode,
	mySignal.follow((value) => {
		console.log(value)
	}).unfollow
)
