import { uniqueId } from "./utils/id.js"

type TagName = `${string}-${string}${string[0]}`

// TODO: Make stylesheet stuff better for developer experience
const EMPTY_STYLESHEET = new CSSStyleSheet()

export function defineComponent(tagName: TagName = `x-${uniqueId()}`) {
	let styleSheets: CSSStyleSheet[] | null = null
	let componentStyleSheet = EMPTY_STYLESHEET

	class Component extends ComponentBase {
		constructor() {
			super()
			this.$shadowRoot.adoptedStyleSheets = styleSheets ??= [...Component.$globalStyleSheets, componentStyleSheet]
		}

		static set $css(styleSheet: CSSStyleSheet) {
			componentStyleSheet = styleSheet
			if (styleSheets) styleSheets[styleSheets.length - 1] = styleSheet
		}
	}

	customElements.define(tagName, Component)

	return Component as unknown as Omit<typeof Component, "new"> & {
		new (): InstanceType<typeof Component>
	}
}

export { ComponentBase as Component }
abstract class ComponentBase extends HTMLElement {
	$shadowRoot: ShadowRoot // needed to access shadowdom in chrome extensions, for some reason shadowRoot returns undefined in chrome extensions

	static $globalStyleSheets: CSSStyleSheet[] = []

	constructor() {
		super()
		this.$shadowRoot = this.attachShadow({ mode: "open" })
	}

	set $html(nodes: Node[]) {
		while (this.$shadowRoot.firstChild) this.$shadowRoot.removeChild(this.$shadowRoot.firstChild)
		this.$shadowRoot.append(...nodes)
	}
}
