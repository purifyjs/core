import { arrayFrom, isFunction } from "../utils/bundleHelpers"

export type Lifecycle = {
	mounted: boolean | null
	listeners: {
		mount: Function[]
		unmount: Function[]
	}
}
const mountables = new WeakMap<Node, Lifecycle>()
function mountableOf(node: Node): Readonly<Lifecycle> {
	let mountable = mountables.get(node)
	if (!mountable) {
		mountables.set(
			node,
			(mountable = {
				mounted: null,
				listeners: {
					mount: [],
					unmount: [],
				},
			})
		)
	}

	return mountable
}

if (typeof window !== "undefined") {
	const mutationObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			arrayFrom(mutation.removedNodes).forEach(removedNode)
			arrayFrom(mutation.addedNodes).forEach((node) => addedNode(node))
		}
	})
	mutationObserver.observe(document, { childList: true, subtree: true })

	const originalAttachShadow = Element.prototype.attachShadow
	Element.prototype.attachShadow = function (options: ShadowRootInit) {
		const shadowRoot = originalAttachShadow.call(this, options)
		if (options.mode === "open") mutationObserver.observe(shadowRoot, { childList: true, subtree: true })
		return shadowRoot
	}

	// Need these for now, because MutationObserver callsback after the cycle is complete
	// Which is not ideal at all, causes a lot of issues and errors
	// TODO: find a better way to do this
	const elementRemove = Element.prototype.remove
	Element.prototype.remove = function () {
		elementRemove.call(this)
		removedNode(this)
	}

	const characterDataRemove = CharacterData.prototype.remove
	CharacterData.prototype.remove = function () {
		characterDataRemove.call(this)
		removedNode(this)
	}

	function addedNode(node: Node) {
		if (!node.isConnected) return
		emitMount(node)
		if (node instanceof HTMLElement) arrayFrom(node.shadowRoot?.childNodes ?? []).forEach((node) => addedNode(node))
		arrayFrom(node.childNodes).forEach((node) => addedNode(node))
	}

	function removedNode(node: Node) {
		emitUnmount(node)
		if (node instanceof HTMLElement) arrayFrom(node.shadowRoot?.childNodes ?? []).forEach(removedNode)
		arrayFrom(node.childNodes).forEach(removedNode)
	}

	function emitMount(node: Node) {
		const mountable = mountables.get(node)
		if (!mountable) return

		if (mountable.mounted) return
		mountable.mounted = true
		mountable.listeners.mount.forEach((listener) => listener())
	}

	function emitUnmount(node: Node) {
		const mountable = mountables.get(node)
		if (!mountable) return

		if (!mountable.mounted) return
		mountable.mounted = false
		mountable.listeners.unmount.forEach((listener) => listener())
	}
}

export type MountListener<R extends Function | void = Function | void> = {
	(): R
}

export function onMount$<T extends MountListener>(node: Node, listener: T) {
	const mountable = mountableOf(node)

	if (mountable.mounted === true) listener()?.()
	else {
		mountable.listeners.mount.push(() => {
			const cleanup = listener()
			if (isFunction(cleanup)) mountable.listeners.unmount.push(cleanup)
		})
	}
}

export function onUnmount$<T extends MountListener>(node: Node, listener: T) {
	const mountable = mountableOf(node)

	if (mountable.mounted === false) listener()?.()
	else {
		mountable.listeners.unmount.push(() => {
			const cleanup = listener()
			if (isFunction(cleanup)) mountable.listeners.mount.push(cleanup)
		})
	}
}
