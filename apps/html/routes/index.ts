import { html } from "../utils/html"
import { GET as getCount } from "./api/counter"

export async function GET() {
	const counter = html` <mx-view key="counter">${await getCount()}</mx-view> `

	return html`
		<script src="/client.js" type="module"></script>
		<div>
			<button mx-on="click: post /api/counter?direction=add set counter">+</button>
			${counter}
			<button mx-on="click: post /api/counter?direction=subtract set counter">-</button>
		</div>
		<div>${counter}</div>
		<div>
			<button mx-on="click: post . set hello">
				<mx-view key="hello">Click me!</mx-view>
			</button>
		</div>
		<div>
			<button mx-on="click: get /api/counter set counter">Update Counters</button>
		</div>
		<div>
			<button mx-on="click: get /never-gonna?1 set player, get /never-gonna?2 set player2">Click me too!</button>
			<div style="display:flex">
				<mx-view key="player" html></mx-view>
				<mx-view key="player" html></mx-view>
			</div>
			<div style="display:flex">
				<mx-view key="player2" html></mx-view>
				<mx-view key="player2" html></mx-view>
			</div>
		</div>
	`
}

export async function POST() {
	return `Hello, the time is ${new Date().toLocaleTimeString()}`
}
