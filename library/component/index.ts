import { makeMountableNode, MountableNode } from "../mountable"
import { randomId } from "../utils/id"

export function defineComponent(tagName: `${string}-${string}${string[0]}` = `x-${randomId()}`) {
	type XComponent = {
		new (): InstanceType<typeof XComponent> & MountableNode
		$css: CSSStyleSheet
	}
	const XComponent = class extends Component {
		private static cssStyleSheet: CSSStyleSheet | null = null

		public static set $css(css: typeof this.cssStyleSheet) {
			this.cssStyleSheet = css
		}

		public set $html(nodes: Node[]) {
			while (this.shadowRoot.firstChild) this.shadowRoot.removeChild(this.shadowRoot.firstChild)
			this.shadowRoot.append(...nodes)
			this.shadowRoot.adoptedStyleSheets = XComponent.cssStyleSheet
				? [...Component.globalCssSheets, XComponent.cssStyleSheet]
				: Component.globalCssSheets
		}
	}
	customElements.define(tagName, XComponent)

	return XComponent as unknown as XComponent
}

export abstract class Component extends HTMLElement {
	public static globalCssSheets: CSSStyleSheet[] = []
	public override shadowRoot: ShadowRoot

	constructor() {
		super()
		this.shadowRoot = this.attachShadow({ mode: "open" })
		makeMountableNode(this)
	}
}
