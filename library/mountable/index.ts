import type { SignalReadable, SignalSubscription, SignalSubscriptionListener, SignalSubscriptionOptions } from "../signal/readable"
import { assert } from "../utils/assert"
import "./mutationObserver"

export interface MountableNode extends Node {
	get $mounted(): boolean | null
	_$emitMount(): void
	_$emitUnmount(): void
	$onMount<T extends Function>(listener: T): void
	$onUnmount<T extends Function>(listener: T): void
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
		_$emitMount() {
			if (_mounted) return
			_mounted = true
			_onMountListeners.forEach((listener) => listener())
		},
		_$emitUnmount() {
			if (!_mounted) return
			_mounted = false
			_onUnmountListeners.forEach((listener) => listener())
		},
		$onMount<T extends Function>(listener: T) {
			if (_mounted === true) listener()
			else _onMountListeners.push(listener)
		},
		$onUnmount<T extends Function>(listener: T) {
			if (_mounted === false) listener()
			else _onUnmountListeners.push(listener)
		},
		$subscribe<T>(signal: SignalReadable<T>, listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions) {
			let subscription: SignalSubscription
			this.$onMount(() => (subscription = signal.subscribe(listener, options)))
			this.$onUnmount(() => subscription.unsubscribe())
		},
		$interval<T>(callback: () => T, delay: number) {
			let interval: number
			this.$onMount(() => (interval = setInterval(callback, delay)))
			this.$onUnmount(() => clearInterval(interval))
		},
		$timeout<T>(callback: () => T, delay: number) {
			let timeout: number
			this.$onMount(() => (timeout = setTimeout(callback, delay)))
			this.$onUnmount(() => clearTimeout(timeout))
		},
	}
	Object.assign(node, impl)

	// xx const name = node instanceof Element ? node.tagName : node.nodeValue || node.nodeName
	// xx impl.$onMount(() => console.log("%cmounted", "color:red;font-weight:bold;font-size:12px", name))
	// xx impl.$onUnmount(() => console.log("%cunmounted", "color:blue;font-weight:bold;font-size:12px", name))
}
