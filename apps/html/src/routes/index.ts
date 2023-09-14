import { html } from "../utils/html"

export const GET = async () => html`
	<script src="./client.js" type="module"></script>
	<template mx-tag="x-counter">
		<mx-fetch url="/api/counter" key="counter">placeholder</mx-fetch>
	</template>

	<div>
		<button mx-on="click : post /api/counter?direction=add set counter">+</button>
		<x-counter></x-counter>
		<button mx-on="click : post /api/counter?direction=subtract, invalidate x-counter">-</button>
	</div>
	<div>
		<x-counter></x-counter>
	</div>
	<div>
		<button mx-on="click : post . set hello">
			<mx-view key="hello">Click me!</mx-view>
		</button>
	</div>
`

export async function POST() {
	return `Hello, the time is ${new Date().toLocaleTimeString()}`
}
