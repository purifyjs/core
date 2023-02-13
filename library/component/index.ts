import type { MountableNode } from "../mountable"
import { assert } from "../utils/assert"
import { bindMethods } from "../utils/bind"
import { randomId } from "../utils/id"

export function defineComponent(tagName: `${string}-${string}${string[0]}` = `x-${randomId()}`) {
	type XComponent = {
		new (): InstanceType<typeof XComponent> & MountableNode
		$css: CSSStyleSheet
	}
	const XComponent = class extends Component {
		private static cssStyleSheet: CSSStyleSheet | null = null

		constructor() {
			super()
			bindMethods(this)
		}

		public static set $css(css: typeof this.cssStyleSheet) {
			this.cssStyleSheet = css
		}

		public set $html(nodes: Node[]) {
			assert<ShadowRoot>(this.shadowRoot)
			while (this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild)
			this.shadowRoot.append(...nodes)
			this.shadowRoot.adoptedStyleSheets = XComponent.cssStyleSheet ? [...Component.globalCss, XComponent.cssStyleSheet] : Component.globalCss
		}
	}
	customElements.define(tagName, XComponent)

	return XComponent as unknown as XComponent
}

export abstract class Component extends HTMLElement {
	public static globalCss: CSSStyleSheet[] = []

	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}
}
