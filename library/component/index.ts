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
			while (super.$root.firstChild) super.$root.removeChild(super.$root.firstChild)
			super.$root.append(...nodes)
			super.$root.adoptedStyleSheets = XComponent.cssStyleSheet
				? [...Component.globalCssSheets, XComponent.cssStyleSheet]
				: Component.globalCssSheets
		}
	}
	customElements.define(tagName, XComponent)

	return XComponent as unknown as XComponent
}

export abstract class Component extends HTMLElement {
	public static globalCssSheets: CSSStyleSheet[] = []
	public $root: ShadowRoot

	constructor() {
		super()
		this.$root = this.attachShadow({ mode: "open" })
		makeMountableNode(this)
	}
}
