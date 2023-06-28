import { uniqueId } from "../utils/id"

type TagName = `${string}-${string}${string[0]}`

const EMPTY_STYLESHEET = new CSSStyleSheet()

export function defineComponent(tagName: TagName = `x-${uniqueId()}`) {
	let styleSheets: CSSStyleSheet[] | null = null
	let componentStyleSheet = EMPTY_STYLESHEET

	class component extends base {
		constructor() {
			super()
			this.$shadowRoot.adoptedStyleSheets = styleSheets ??= [...component.$globalStyleSheets, componentStyleSheet]
		}

		static set $css(styleSheet: CSSStyleSheet) {
			componentStyleSheet = styleSheet
			if (styleSheets) styleSheets[styleSheets.length - 1] = styleSheet
		}
	}

	customElements.define(tagName, component)

	type Component = Omit<typeof component, "new"> & {
		new (): InstanceType<typeof component>
	}

	return component as unknown as Component
}

export { base as Component }
abstract class base extends HTMLElement {
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
