import type { SignalReadable, SignalSubscription, SignalSubscriptionListener, SignalSubscriptionOptions } from "../signal"

export type UnknownListenerWithCleanup = ListenerWithCleanup<Function | void>
export type ListenerWithCleanup<R extends Function | void> = {
	(): R
}

const mountableNodes = new WeakMap<Node, Mountable>()
const mountableNodeEmitters = new WeakMap<Node, Emitter>()

type Emitter = {
	emitMount(): void
	emitUnmount(): void
}

export type Mountable = {
	get $mounted(): boolean | null
	$onMount<T extends UnknownListenerWithCleanup>(listener: T): void
	$onUnmount<T extends UnknownListenerWithCleanup>(listener: T): void
	$subscribe<T>(signal: SignalReadable<T>, listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions): void
	$effect<T extends SignalReadable<any>[]>(callback: () => void, signals: T): void
	$interval<T>(callback: () => T, delay: number): void
	$timeout<T>(callback: () => T, delay: number): void
}
export namespace Mountable {
	const mutationObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			Array.from(mutation.removedNodes).forEach(removedNode)
			Array.from(mutation.addedNodes).forEach((node) => addedNode(node))
		}
	})
	mutationObserver.observe(document, { childList: true, subtree: true })

	const originalAttachShadow = Element.prototype.attachShadow
	Element.prototype.attachShadow = function (options: ShadowRootInit) {
		const shadowRoot = originalAttachShadow.call(this, options)
		if (options.mode === "open") mutationObserver.observe(shadowRoot, { childList: true, subtree: true })
		return shadowRoot
	}

	/**
	 * @internal
	 */
	export function addedNode(node: Node) {
		if (node.getRootNode({ composed: true }) !== document) return
		mountableNodeEmitters.get(node)?.emitMount()
		if (node instanceof HTMLElement) Array.from(node.shadowRoot?.childNodes ?? []).forEach((node) => addedNode(node))
		Array.from(node.childNodes).forEach((node) => addedNode(node))
	}

	/**
	 * @internal
	 */
	export function removedNode(node: Node) {
		mountableNodeEmitters.get(node)?.emitUnmount()
		if (node instanceof HTMLElement) Array.from(node.shadowRoot?.childNodes ?? []).forEach(removedNode)
		Array.from(node.childNodes).forEach(removedNode)
	}

	export function of<T extends Node>(node: T): Mountable {
		let mountable = mountableNodes.get(node)
		if (mountable) return mountable

		let mounted: boolean | null = null
		const onMountListeners: Function[] = []
		const onUnmountListeners: Function[] = []

		function emitMount() {
			if (mounted) return
			mounted = true
			onMountListeners.forEach((listener) => listener())
		}

		function emitUnmount() {
			if (!mounted) return
			mounted = false
			onUnmountListeners.forEach((listener) => listener())
		}

		mountableNodeEmitters.set(node, {
			emitMount,
			emitUnmount,
		})

		mountableNodes.set(
			node,
			(mountable = {
				get $mounted() {
					return mounted
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
			})
		)

		return mountable

		// xx const name = node instanceof Element ? node.tagName : node.nodeValue || node.nodeName
		// xx impl.$onMount(() => console.log("%cmounted", "color:red;font-weight:bold;font-size:12px", name))
		// xx impl.$onUnmount(() => console.log("%cunmounted", "color:blue;font-weight:bold;font-size:12px", name))
	}
}
