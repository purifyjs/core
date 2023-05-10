import { MountableNode } from "../mountable"
import { uniqueId } from "../utils/id"

type TagName = `${string}-${string}${string[0]}`

const componentLayerName = `master-ts-component`

export function defineComponent(tagName: TagName = `x-${uniqueId()}`) {
	class Component extends ComponentBase {
		constructor() {
			super()
			this.$shadowRoot.adoptedStyleSheets = [...ComponentBase.$globalStyleSheets, Component.$styleSheet]
		}

		private static $styleSheet = new CSSStyleSheet()
		public static set $css(css: string) {
			this.$styleSheet.replaceSync(`@layer ${componentLayerName}{${css}}`)
		}
	}

	customElements.define(tagName, Component)

	return Component as unknown as Omit<typeof Component, "new"> & { new (): InstanceType<typeof Component> & MountableNode }
}

export { ComponentBase as Component }
class ComponentBase extends HTMLElement {
	public $shadowRoot: ShadowRoot // needed to access shadowdom in chrome extensions, for some reason shadowRoot returns undefined in chrome extensions

	public static $globalStyleSheets: CSSStyleSheet[] = []

	constructor() {
		super()
		MountableNode.make(this)
		this.$shadowRoot = this.attachShadow({ mode: "open" })
	}

	public set $html(nodes: Node[]) {
		while (this.$shadowRoot.firstChild) this.$shadowRoot.removeChild(this.$shadowRoot.firstChild)
		this.$shadowRoot.append(...nodes)
	}
}
