import { fragment } from "master-ts/core"
import { html } from "master-ts/extra/html"

function App() {
	return html` <h1>Welcome to My App</h1> `
}

document.body.append(fragment(App()))
