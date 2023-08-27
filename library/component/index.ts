import { append } from "../utils/bundleHelpers"
import { uniqueId } from "../utils/id"

type TagName = `${string}-${string}${string[0]}`

const EMPTY_STYLESHEET = new CSSStyleSheet()

export function defineComponent(tagName: TagName = `x-${uniqueId()}`) {
	let styleSheets: CSSStyleSheet[] | null = null
	let componentStyleSheet = EMPTY_STYLESHEET

	class Component extends ComponentBase {
		constructor() {
			super()
			this.$shadowRoot.adoptedStyleSheets = styleSheets ??= [...Component.$globalStyleSheets, componentStyleSheet]
		}

		static override set $css(styleSheet: CSSStyleSheet) {
			componentStyleSheet = styleSheet
			if (styleSheets) styleSheets[styleSheets.length - 1] = styleSheet
		}
		static override get $css() {
			return componentStyleSheet
		}
	}

	customElements.define(tagName, Component)

	return Component
}

export abstract class ComponentBase extends HTMLElement {
	$shadowRoot: ShadowRoot // needed to access shadowdom in chrome extensions, for some reason shadowRoot returns undefined in chrome extensions

	static $globalStyleSheets: CSSStyleSheet[] = []

	constructor() {
		super()
		this.$shadowRoot = this.attachShadow({ mode: "open" })
	}

	set $html(nodes: Node[]) {
		while (this.$shadowRoot.firstChild) this.$shadowRoot.removeChild(this.$shadowRoot.firstChild)
		append(this.$shadowRoot, ...nodes)
	}

	static get $css(): CSSStyleSheet {
		throw new Error("Not implemented")
	}
	static set $css(_: CSSStyleSheet) {
		throw new Error("Not implemented")
	}
}
