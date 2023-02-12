import type { MountableNode } from "../mountable"
import type { CssTemplateString } from "../template/css"
import { assert } from "../utils/assert"
import { bindMethods } from "../utils/bind"
import { randomId } from "../utils/id"

export function defineComponent(tagName: `${string}-${string}${string[0]}` = `x-${randomId()}`) {
	type XComponent = {
		new (): InstanceType<typeof XComponent> & MountableNode
		$css: CssTemplateString
		globalFragmentBefore: DocumentFragment
		globalFragmentAfter: DocumentFragment
	}
	const XComponent = class extends Component {
		protected static cssString = ""

		constructor() {
			super()
			bindMethods(this)
		}

		public static set $css(css: CssTemplateString) {
			XComponent.cssString = css
		}

		public set $html(nodes: Node[]) {
			assert<ShadowRoot>(this.shadowRoot)

			while (this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild)

			this.shadowRoot.append(Component.globalFragmentBefore.cloneNode(true))

			const style = document.createElement("style")
			style.textContent = XComponent.cssString
			this.shadowRoot.append(style)

			this.shadowRoot.append(...nodes)

			this.shadowRoot.append(Component.globalFragmentAfter.cloneNode(true))
		}
	}
	customElements.define(tagName, XComponent)

	return XComponent as unknown as XComponent
}

export abstract class Component extends HTMLElement {
	public static readonly globalFragmentBefore = document.createDocumentFragment()
	public static readonly globalFragmentAfter = document.createDocumentFragment()

	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}
}
