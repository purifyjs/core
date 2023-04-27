import type { SignalReadable, SignalSubscription, SignalSubscriptionListener, SignalSubscriptionOptions } from "../signal"

export type UnknownListenerWithCleanup = ListenerWithCleanup<Function | void>
export type ListenerWithCleanup<R extends Function | void> = {
	(): R
}

const TRY_EMIT_MOUNT = Symbol("try-emit-mount")
const TRY_EMIT_UNMOUNT = Symbol("try-emit-unmount")

const NODE_IN_DOM = Symbol()
type NODE_IN_DOM = typeof NODE_IN_DOM
const NODE_UNKNOWN_PLACE = Symbol()
type NODE_NOT_IN_DOM = typeof NODE_UNKNOWN_PLACE
type NodePlace = NODE_IN_DOM | NODE_NOT_IN_DOM

const mountUnmountObserver = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		Array.from(mutation.removedNodes).forEach(removedNode)
		Array.from(mutation.addedNodes).forEach((node) => addedNode(node, NODE_UNKNOWN_PLACE))
	}
})
mountUnmountObserver.observe(document, { childList: true, subtree: true })

const originalAttachShadow = Element.prototype.attachShadow
Element.prototype.attachShadow = function (options: ShadowRootInit) {
	const shadowRoot = originalAttachShadow.call(this, options)
	if (options.mode === "open") mountUnmountObserver.observe(shadowRoot, { childList: true, subtree: true })
	return shadowRoot
}

export function addedNode(node: Node, place: NodePlace = NODE_UNKNOWN_PLACE) {
	if (place === NODE_UNKNOWN_PLACE && getRootNode(node) !== document) return
	if (isMountableNode(node)) node[TRY_EMIT_MOUNT]()
	if (node instanceof HTMLElement) Array.from(node.shadowRoot?.childNodes ?? []).forEach((node) => addedNode(node, NODE_IN_DOM))
	Array.from(node.childNodes).forEach((node) => addedNode(node, NODE_IN_DOM))
}

export function removedNode(node: Node) {
	if (isMountableNode(node)) node[TRY_EMIT_UNMOUNT]()
	if (node instanceof HTMLElement) Array.from(node.shadowRoot?.childNodes ?? []).forEach(removedNode)
	Array.from(node.childNodes).forEach(removedNode)
}

function getRootNode(node: Node): Node {
	if (node instanceof ShadowRoot) return getRootNode(node.host)
	if (node.parentNode) return getRootNode(node.parentNode)
	return node
}

export type MountableNode = Node & {
	get $mounted(): boolean | null
	[TRY_EMIT_MOUNT](): void
	[TRY_EMIT_UNMOUNT](): void
	$onMount<T extends UnknownListenerWithCleanup>(listener: T): void
	$onUnmount<T extends UnknownListenerWithCleanup>(listener: T): void
	$subscribe<T>(signal: SignalReadable<T>, listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions): void
	$effect<T extends SignalReadable<any>[]>(callback: () => void, signals: T): void
	$interval<T>(callback: () => T, delay: number): void
	$timeout<T>(callback: () => T, delay: number): void
}

const mountableNodes = new WeakSet<MountableNode>()
export function isMountableNode<T extends Node>(node: T): node is T & MountableNode {
	return mountableNodes.has(node as unknown as MountableNode)
}

export function mountableNodeAssert<T extends Node>(node: T): asserts node is T & MountableNode {
	if (isMountableNode(node)) return
	type Impl = Pick<MountableNode, Exclude<keyof MountableNode, keyof Node>>
	let mounted: boolean | null = null
	const onMountListeners: Function[] = []
	const onUnmountListeners: Function[] = []

	const impl: Impl = {
		get $mounted() {
			return mounted
		},
		[TRY_EMIT_MOUNT]() {
			if (mounted) return
			mounted = true
			onMountListeners.forEach((listener) => listener())
		},
		[TRY_EMIT_UNMOUNT]() {
			if (!mounted) return
			mounted = false
			onUnmountListeners.forEach((listener) => listener())
		},
		$onMount(listener) {
			if (mounted === true) listener()?.()
			else {
				onMountListeners.push(() => {
					const cleanup = listener()
					if (typeof cleanup === "function") onUnmountListeners.push(cleanup)
				})
			}
		},
		$onUnmount(listener) {
			if (mounted === false) listener()?.()
			else {
				onUnmountListeners.push(() => {
					const cleanup = listener()
					if (typeof cleanup === "function") onMountListeners.push(cleanup)
				})
			}
		},
		$subscribe(signal, listener, options) {
			let subscription: SignalSubscription
			this.$onMount(() => {
				subscription = signal.subscribe(listener, options)
			})
			this.$onUnmount(() => subscription.unsubscribe())
		},
		$effect(callback, signals) {
			let subscriptions: SignalSubscription[] = new Array(signals.length)

			this.$onMount(() => {
				for (let i = 0; i < signals.length; i++) subscriptions[i] = signals[i]!.subscribe(callback)
				callback()
			})
			this.$onUnmount(() => subscriptions.forEach((subscription) => subscription.unsubscribe()))
		},
		$interval(callback, delay) {
			this.$onMount(() => {
				const interval = setInterval(callback, delay)
				return () => clearInterval(interval)
			})
		},
		$timeout(callback, delay) {
			this.$onMount(() => {
				const timeout = setTimeout(callback, delay)
				return () => clearTimeout(timeout)
			})
		},
	}

	mountableNodes.add(Object.assign(node, impl))

	const name = node instanceof Element ? node.tagName : node.nodeValue || node.nodeName
	impl.$onMount(() => console.log("%cmounted", "color:red;font-weight:bold;font-size:12px", name))
	impl.$onUnmount(() => console.log("%cunmounted", "color:blue;font-weight:bold;font-size:12px", name))
}

export function mountableNodeFrom<T extends Node>(node: T): T & MountableNode {
	mountableNodeAssert(node)
	return node
}
