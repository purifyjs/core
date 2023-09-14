import { Signal, signal, tagsNS } from "master-ts/lib/core"
import { css } from "master-ts/lib/extra/css"
import { createWeakCache } from "./utils/weakCache"

const responseCache = createWeakCache<string, Signal<string>>()

function set(key: string, value: string): Signal<string> {
	const cache = responseCache.get(key)
	if (!cache) return responseCache.set(key, signal(value))
	cache.ref = value
	return cache
}

const fetchGETCache = new Map<string, Promise<string>>()
async function fetchGET(url: string): Promise<string> {
	const cache = fetchGETCache.get(url)
	if (cache) return cache
	const promise = fetch(url).then(async (response) => {
		const text = await response.text()
		fetchGETCache.delete(url)
		return text
	})
	fetchGETCache.set(url, promise)
	return promise
}

function invalidateAll(selector: string) {
	console.log(selector)
	Array.from(document.querySelectorAll(selector)).forEach((element) => element.replaceWith(element.cloneNode(true)))
}

const style = css`
	:host {
		display: contents;
	}
`

customElements.define(
	"mx-fetch",
	class extends HTMLElement {
		constructor() {
			super()
			const dom = this.attachShadow({ mode: "open" })
			dom.adoptedStyleSheets.push(style)
			dom.append(tagsNS.slot())

			const url = this.getAttribute("url")
			if (!url) return
			const key = this.getAttribute("key") ?? url
			const html = this.hasAttribute("html")

			fetchGET(url).then((response) => {
				const responseTextSignal = set(key, response)
				responseTextSignal.follow$(
					this,
					(value) => {
						if (html) this.innerHTML = value
						else this.textContent = value
					},
					{ mode: "immediate" }
				)
			})
		}
	}
)

customElements.define(
	"mx-view",
	class extends HTMLElement {
		constructor() {
			super()
			const dom = this.attachShadow({ mode: "open" })
			dom.adoptedStyleSheets.push(style)
			dom.append(tagsNS.slot())

			const key = this.getAttribute("key")
			if (!key) return

			const cache = responseCache.get(key)
			if (cache) {
				cache.follow$(this, (value) => this.#set(value), { mode: "immediate" })
			} else {
				const textSignal = responseCache.set(key, signal(""))
				textSignal.follow$(this, (value) => this.#set(value))
			}
		}

		#set(value: string) {
			if (this.hasAttribute("html")) this.innerHTML = value
			else this.textContent = value
		}
	}
)

window.addEventListener("load", () => {
	document.querySelectorAll<HTMLTemplateElement>("template[mx-tag]").forEach((template) => {
		const tag = template.getAttribute("mx-tag")!
		customElements.define(
			tag,
			class extends HTMLElement {
				constructor() {
					super()
					if (!this.childNodes.length) this.appendChild(template.content.cloneNode(true))
				}
			}
		)
	})

	const appliedElements = new WeakSet<Element>()
	function applyAttributes(root: Element) {
		const elements = root.querySelectorAll<Element>("[mx-on]")
		for (const element of elements) {
			if (appliedElements.has(element)) continue
			appliedElements.add(element)
			const attribute = element.getAttribute("mx-on")!
			const eventNameSuffix = ":"
			const indexOfEventNameSuffix = attribute.indexOf(eventNameSuffix)
			if (indexOfEventNameSuffix === -1) continue
			const eventName = attribute.substring(0, indexOfEventNameSuffix).trim()
			const actions = attribute
				.substring(indexOfEventNameSuffix + eventNameSuffix.length)
				.trim()
				.split(",")
			if (actions.length === 0) continue

			function buildActionFunction(index = 0, previousFn: (() => Promise<unknown>) | null = null) {
				if (index === actions.length) return previousFn
				const [actionName, ...actionArgs] = actions[index]!.trim().replace(/\s+/g, " ").split(" ")
				const fn: typeof previousFn =
					actionName === "post" && actionArgs.length >= 1
						? actionArgs.length >= 3 && actionArgs[1] === "set"
							? async () => {
									const response = fetch(actionArgs[0]!, { method: "POST" }).then((response) =>
										response.text()
									)
									const cache = responseCache.get(actionArgs[2]!)
									if (cache) cache.ref = await response
							  }
							: async () => fetch(actionArgs[0]!, { method: "POST" })
						: actionName === "invalidate" && actionArgs.length >= 1
						? async () => invalidateAll(actionArgs[0]!)
						: null
				return buildActionFunction(index + 1, async () => {
					if (previousFn) await previousFn()
					if (fn) await fn()
				})
			}

			const fn = buildActionFunction()
			if (fn) element.addEventListener(eventName, fn)
		}
	}

	applyAttributes(document.body)
})
