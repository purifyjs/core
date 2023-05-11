import { MountableNode } from "../mountable"
import { uniqueId } from "../utils/id"

type TagName = `${string}-${string}${string[0]}`

export function defineComponent(tagName: TagName = `x-${uniqueId()}`) {
	class Component extends ComponentBase {
		constructor() {
			super()
			if (Component.#styleSheets.length === 0) Component.#styleSheets.push(...ComponentBase.$globalStyleSheets)
			this.$shadowRoot.adoptedStyleSheets = Component.#styleSheets
		}

		static #styleSheets: CSSStyleSheet[] = []

		static set $css(css: CSSStyleSheet) {
			while (this.#styleSheets.pop());
			this.#styleSheets.push(...ComponentBase.$globalStyleSheets, css)
		}
	}

	customElements.define(tagName, Component)

	return Component as unknown as Omit<typeof Component, "new"> & { new (): InstanceType<typeof Component> & MountableNode }
}

export { ComponentBase as Component }
class ComponentBase extends HTMLElement {
	$shadowRoot: ShadowRoot // needed to access shadowdom in chrome extensions, for some reason shadowRoot returns undefined in chrome extensions

	static $globalStyleSheets: CSSStyleSheet[] = []

	constructor() {
		super()
		MountableNode.make(this)
		this.$shadowRoot = this.attachShadow({ mode: "open" })
	}

	set $html(nodes: Node[]) {
		while (this.$shadowRoot.firstChild) this.$shadowRoot.removeChild(this.$shadowRoot.firstChild)
		this.$shadowRoot.append(...nodes)
	}
}
