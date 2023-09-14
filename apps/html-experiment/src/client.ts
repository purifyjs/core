import { Signal, signal, tagsNS } from "master-ts/core"
import { css } from "master-ts/extra/css"
import { WeakCache } from "./utils/weakCache"

const responseCache = new WeakCache<string, Signal<string | null>>()

function set(key: string, value: string): Signal<string> {
	const cache = responseCache.get(key)
	if (!cache) return responseCache.set(key, signal(value))
	cache.ref = value
	return cache as Signal<string>
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
	"mx-view",
	class extends HTMLElement {
		constructor() {
			super()
			const dom = this.attachShadow({ mode: "open" })
			dom.adoptedStyleSheets.push(style)
			dom.append(tagsNS.slot())

			const key = this.getAttribute("key")
			if (!key) return

			const html = this.hasAttribute("html")

			const set = (value: string) => {
				if (html) this.innerHTML = value
				else this.textContent = value
			}

			const cache = responseCache.get(key) ?? responseCache.set(key, signal(null))
			cache.follow$(this, (value) => value !== null && set(value), { mode: "immediate" })
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
		applyAttributesToElement(root)
		for (const element of elements) applyAttributesToElement(element)
	}

	function applyAttributesToElement(element: Element) {
		if (appliedElements.has(element)) return
		appliedElements.add(element)
		const attribute = element.getAttribute("mx-on")
		if (!attribute) return
		const eventNameSuffix = ":"
		const indexOfEventNameSuffix = attribute.indexOf(eventNameSuffix)
		if (indexOfEventNameSuffix === -1) return
		const eventName = attribute.substring(0, indexOfEventNameSuffix).trim()
		const actions = attribute
			.substring(indexOfEventNameSuffix + eventNameSuffix.length)
			.trim()
			.split(",")
		if (actions.length === 0) return

		console.log(element, eventName, actions)

		function buildActionFunction(index = 0, previousFn: (() => Promise<unknown>) | null = null) {
			if (index === actions.length) return previousFn
			const [actionName, ...actionArgs] = actions[index]!.trim().replace(/\s+/g, " ").split(" ")
			const fn: typeof previousFn =
				(actionName === "post" || actionName === "get") && actionArgs.length >= 1
					? actionArgs.length >= 3 && actionArgs[1] === "set"
						? async () => {
								const response =
									actionName === "get"
										? fetchGET(actionArgs[0]!)
										: fetch(actionArgs[0]!, { method: actionName.toUpperCase() }).then((response) =>
												response.text()
										  )
								const keys = actionArgs.slice(2)
								for (const key of keys) {
									const cache = responseCache.get(key)
									if (cache) cache.ref = await response
								}
						  }
						: async () =>
								actionName === "get"
									? fetchGET(actionArgs[0]!)
									: fetch(actionArgs[0]!, { method: actionName.toUpperCase() })
					: actionName === "invalidate" && actionArgs.length >= 1
					? async () => invalidateAll(actionArgs.join(" "))
					: null
			return buildActionFunction(index + 1, async () => {
				if (previousFn) await previousFn()
				if (fn) await fn()
			})
		}

		const fn = buildActionFunction()
		if (fn) element.addEventListener(eventName, fn)
	}

	applyAttributes(document.body)
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (node instanceof Element) applyAttributes(node)
			}
		}
	}).observe(document.body, { childList: true, subtree: true })
})
