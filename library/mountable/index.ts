import type { SignalReadable, SignalSubscription, SignalSubscriptionListener, SignalSubscriptionOptions } from "../signal/readable"
import { assert } from "../utils/assert"

export type UnknownListenerWithCleanup = ListenerWithCleanup<Function | void>
export type ListenerWithCleanup<R extends Function | void> = {
	(): R
}

const EMIT_MOUNT = Symbol("emit_mount")
type EMIT_MOUNT = typeof EMIT_MOUNT
const EMIT_UNMOUNT = Symbol("emit_unmount")
type EMIT_UNMOUNT = typeof EMIT_UNMOUNT

{
	const enum NodePlace {
		InDOM,
		Unknown,
	}

	const mountUnmountObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			Array.from(mutation.removedNodes).forEach(removedNode)
			Array.from(mutation.addedNodes).forEach((node) => addedNode(node, NodePlace.Unknown))
		}
	})
	mountUnmountObserver.observe(document, { childList: true, subtree: true })
	const originalAttachShadow = Element.prototype.attachShadow
	Element.prototype.attachShadow = function (options: ShadowRootInit) {
		const shadowRoot = originalAttachShadow.call(this, options)
		if (options.mode === "open") mountUnmountObserver.observe(shadowRoot, { childList: true, subtree: true })
		return shadowRoot
	}

	function addedNode(node: Node, place: NodePlace) {
		if (place === NodePlace.Unknown && getRootNode(node) !== document) return
		if (isMountableNode(node)) node[EMIT_MOUNT]()
		Array.from(node.childNodes).forEach((node) => addedNode(node, NodePlace.InDOM))
		if (node instanceof HTMLElement) Array.from(node.shadowRoot?.childNodes ?? []).forEach((node) => addedNode(node, NodePlace.InDOM))
	}

	function removedNode(node: Node) {
		if (isMountableNode(node)) node[EMIT_UNMOUNT]()
		Array.from(node.childNodes).forEach(removedNode)
		if (node instanceof HTMLElement) Array.from(node.shadowRoot?.childNodes ?? []).forEach(removedNode)
	}

	function getRootNode(node: Node): Node {
		if (node instanceof ShadowRoot) return getRootNode(node.host)
		if (node.parentNode) return getRootNode(node.parentNode)
		return node
	}
}

export type MountableNode = Node & {
	get $mounted(): boolean | null
	[EMIT_MOUNT](): void
	[EMIT_UNMOUNT](): void
	$onMount<T extends UnknownListenerWithCleanup>(listener: T): void
	$onUnmount<T extends UnknownListenerWithCleanup>(listener: T): void
	$subscribe<T>(signal: SignalReadable<T>, listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions): void
	$interval<T>(callback: () => T, delay: number): void
	$timeout<T>(callback: () => T, delay: number): void
}

export function isMountableNode<T extends Node>(node: T): node is MountableNode & T {
	assert<MountableNode>(node)
	return node.$mounted !== undefined
}

export function asMountableNode<T extends Node>(node: T): MountableNode & T {
	makeMountableNode(node)
	return node
}

export function makeMountableNode<T extends Node>(node: T): asserts node is MountableNode & T {
	if (isMountableNode(node)) return
	type Impl = Pick<MountableNode, Exclude<keyof MountableNode, keyof Node>>
	let _mounted: boolean | null = null
	const _onMountListeners: Function[] = []
	const _onUnmountListeners: Function[] = []

	const impl: Impl = {
		get $mounted() {
			return _mounted
		},
		[EMIT_MOUNT]() {
			if (_mounted) return
			_mounted = true
			_onMountListeners.forEach((listener) => listener())
		},
		[EMIT_UNMOUNT]() {
			if (!_mounted) return
			_mounted = false
			_onUnmountListeners.forEach((listener) => listener())
		},
		$onMount<T extends UnknownListenerWithCleanup>(listener: T) {
			if (_mounted === true) listener()?.()
			else {
				_onMountListeners.push(() => {
					const cleanup = listener()
					if (cleanup instanceof Function) _onUnmountListeners.push(cleanup)
				})
			}
		},
		$onUnmount<T extends UnknownListenerWithCleanup>(listener: T) {
			if (_mounted === false) listener()?.()
			else {
				_onUnmountListeners.push(() => {
					const cleanup = listener()
					if (cleanup instanceof Function) _onMountListeners.push(cleanup)
				})
			}
		},
		$subscribe<T>(signal: SignalReadable<T>, listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions) {
			let subscription: SignalSubscription
			this.$onMount(() => {
				subscription = signal.subscribe(listener, options)
			})
			this.$onUnmount(() => subscription.unsubscribe())
		},
		$interval<T>(callback: () => T, delay: number) {
			this.$onMount(() => {
				const interval = setInterval(callback, delay)
				return () => clearInterval(interval)
			})
		},
		$timeout<T>(callback: () => T, delay: number) {
			this.$onMount(() => {
				const timeout = setTimeout(callback, delay)
				return () => clearTimeout(timeout)
			})
		},
	}
	Object.assign(node, impl)

	// xx const name = node instanceof Element ? node.tagName : node.nodeValue || node.nodeName
	// xx impl.$onMount(() => console.log("%cmounted", "color:red;font-weight:bold;font-size:12px", name))
	// xx impl.$onUnmount(() => console.log("%cunmounted", "color:blue;font-weight:bold;font-size:12px", name))
}
