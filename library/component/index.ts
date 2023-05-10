import { MountableNode } from "../mountable"
import { uniqueId } from "../utils/id"

type TagName = `${string}-${string}${string[0]}`

// TODO: Improve developer experiance for styles

const componentLayerName = `component-${uniqueId()}`
const globalLayerName = `global-${uniqueId()}`

export function defineComponent(tagName: TagName = `x-${uniqueId()}`) {
	class Component extends ComponentBase {
		constructor() {
			super()
			MountableNode.make(this)
			this.$shadowRoot.adoptedStyleSheets = [ComponentBase.$globalStyleSheet, Component.$_css]
		}

		private static $_css = new CSSStyleSheet()
		public static set $css(value: string) {
			this.$_css.replaceSync(`@layer ${componentLayerName} { ${value} }`)
		}

		public set $html(nodes: Node[]) {
			while (this.$shadowRoot.firstChild) this.$shadowRoot.removeChild(this.$shadowRoot.firstChild)
			this.$shadowRoot.append(...nodes)
		}
	}

	customElements.define(tagName, Component)

	return Component as unknown as Omit<typeof Component, "new"> & { new (): InstanceType<typeof Component> & MountableNode }
}

export { ComponentBase as Component }
class ComponentBase extends HTMLElement {
	public $shadowRoot: ShadowRoot // needed to access shadowdom in chrome extensions, for some reason shadowRoot returns undefined in chrome extensions

	private static $_globalStyleSheet = new CSSStyleSheet()
	public static get $globalStyleSheet() {
		return this.$_globalStyleSheet
	}

	private static $_globalCSS: string[] = []
	public static $insertGlobalCSS(css: string) {
		this.$_globalCSS.push(css)
		this.$_globalStyleSheet.replaceSync(
			`@layer ${globalLayerName}, ${componentLayerName}; @layer ${globalLayerName} { ${this.$_globalCSS.join("\n")} }`
		)
	}

	constructor() {
		super()
		this.$shadowRoot = this.attachShadow({ mode: "open" })
	}
}
