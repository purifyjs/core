import type { MountableNode } from "../mountable"
import { bindMethods } from "../utils/bind"
import { randomId } from "../utils/id"

export function defineComponent(tagName = `x-${randomId()}`) {
	type Component = typeof Component
	const Component = class extends ComponentBase {
		protected static cssString = ""

		constructor() {
			super()
			bindMethods(this)
		}

		public static set $css(css: string) {
			Component.cssString = css
		}

		public set $html(nodes: Node[]) {
			while (this.shadowRoot!.firstChild) this.shadowRoot!.removeChild(this.shadowRoot!.firstChild)

			this.shadowRoot!.append(ComponentBase.globalFragmentBefore.cloneNode(true))

			const style = document.createElement("style")
			style.textContent = Component.cssString
			this.shadowRoot!.append(style)

			this.shadowRoot!.append(...nodes)

			this.shadowRoot!.append(ComponentBase.globalFragmentAfter.cloneNode(true))
		}
	}
	customElements.define(tagName, Component)

	return Component as any as {
		new (): InstanceType<Component> & MountableNode
		$css: string
		globalFragmentBefore: DocumentFragment
		globalFragmentAfter: DocumentFragment
	}
}

export abstract class ComponentBase extends HTMLElement {
	public static readonly globalFragmentBefore = document.createDocumentFragment()
	public static readonly globalFragmentAfter = document.createDocumentFragment()

	constructor() {
		super()
		this.attachShadow({ mode: "open" })
	}
}
