import { fragment } from "../../lib/core"
import { html } from "../../lib/extra/html"

const contents = html` <div class="hello">Hello World</div> `

const contentsFragment = fragment(contents)

document.body.append(contentsFragment)
