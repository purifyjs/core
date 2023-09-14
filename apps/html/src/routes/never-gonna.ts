import { html } from "../utils/html"
import { uniqueId } from "../utils/unique"

export async function GET() {
	const playerId = uniqueId()

	return html`
		<iframe
			width="560"
			height="315"
			src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=MAuDDFtbGcZ3JhHt&autoplay=1"
			title="YouTube video player"
			id="${playerId}"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowfullscreen></iframe>
		<div>
			<button mx-on="click : invalidate #${playerId}">Invalidate Player</button>
		</div>
	`
}
