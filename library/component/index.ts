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
			while (this.$root.firstChild) this.$root.removeChild(this.$root.firstChild)
			this.$root.append(...nodes)
			this.$root.adoptedStyleSheets = XComponent.cssStyleSheet
				? [...Component.globalCssSheets, XComponent.cssStyleSheet]
				: Component.globalCssSheets
		}
	}
	customElements.define(tagName, XComponent)

	return XComponent as unknown as XComponent
}

export abstract class Component extends HTMLElement {
	public static globalCssSheets: CSSStyleSheet[] = []
	public $root: ShadowRoot // needed to access shadowdom in chrome extensions, for some reason shadowRoot returns undefined in chrome extensions

	constructor() {
		super()
		this.$root = this.attachShadow({ mode: "open" })
		makeMountableNode(this)
	}
}
