import { onMount$, onUnmount$ } from "../lifecycle/index"
import { uniqueId } from "../utils/id"

export type SignalSubscription = {
	unsubscribe(): void
}
export namespace SignalSubscription {
	export type Listener<T> = {
		<U extends T>(value: U): unknown
	}

	export type Options = {
		mode: "normal" | "once" | "immediate"
	}
}

export type SignalSetter<T> = {
	<U extends T>(value: U): void
}

export type SignalUpdater<T> = {
	(set: SignalSetter<T>, signal: SignalReadable<T>["signal"]): Function
}

/**
 * @internal
 */
export const signalSyncContextStack: Set<SignalReadable>[] = []

export interface SignalReadable<T = unknown> {
	get id(): string
	get(silent?: boolean): T
	get ref(): T
	subscribe(listener: SignalSubscription.Listener<T>, options?: SignalSubscription.Options): SignalSubscription
	subscribe$(node: Node, listener: SignalSubscription.Listener<T>, options?: SignalSubscription.Options): void
	signal(): void
	get listenerCount(): number
}
export interface SignalWritable<T = unknown> extends SignalReadable<T> {
	set(value: T): void
	set ref(value: T)
}
const readables = new WeakSet<SignalReadable>()
const writables = new WeakSet<SignalWritable>()

export function isSignalWritable(value: unknown): value is SignalWritable {
	return writables.has(value as SignalWritable)
}
export function isSignalReadable(value: unknown): value is SignalReadable {
	return readables.has(value as SignalReadable)
}

const signalling = new WeakSet<SignalReadable>()
export function createSignalWritable<T>(initial: T) {
	const listeners = new Set<SignalSubscription.Listener<T>>()
	let value = initial

	const self: SignalWritable<T> = {
		id: uniqueId(),
		get listenerCount() {
			return listeners.size
		},
		get(silent) {
			if (!silent && signalSyncContextStack.length > 0) signalSyncContextStack[signalSyncContextStack.length - 1]!.add(self)
			return value
		},
		set(newValue) {
			if (value === newValue) return
			value = newValue
			self.signal()
		},
		get ref() {
			return self.get()
		},
		set ref(newValue) {
			self.set(newValue)
		},
		subscribe(listener, options) {
			switch (options?.mode) {
				case "once":
					const onceCallback = () => {
						listener(self.get())
						listeners.delete(onceCallback)
					}
					listeners.add(onceCallback)
					break
				case "immediate":
					listener(self.get())
				case "normal":
				default:
					listeners.add(listener)
					break
			}
			// xx console.log("%csubscribed", "color:orange", listener, "from", self.id, value, [...listeners])
			return {
				unsubscribe: () => {
					listeners.delete(listener)
					// xx console.log("%cunsubscribed", "color:orange", listener, "from", self.id, value, [...listeners])
				},
			}
		},
		subscribe$(node, listener, options) {
			let subscription: SignalSubscription
			onMount$(node, () => {
				subscription = self.subscribe(listener, options)
			})
			onUnmount$(node, () => subscription.unsubscribe())
		},
		signal() {
			if (signalling.has(self)) throw new Error("Avoided recursive signalling.")
			signalling.add(self)
			// xx console.log("%csignalling", "color:blue", self.id, value, [...listeners])
			listeners.forEach((callback) => callback(self.get()))
			signalling.delete(self)
		},
	}
	writables.add(self)
	readables.add(self)
	return self
}

export function createSignalReadable<T>(updater: SignalUpdater<T>, initial?: T) {
	const base = createSignalWritable<T>(initial!)
	let cleaner: Function | null = null

	function tryActivate() {
		if (cleaner) return false
		// xx console.log("%cactiving", "color:red", self.id)
		signalSyncContextStack.push(new Set())
		cleaner = updater(base.set, self.signal)
		signalSyncContextStack.pop()
		// xx console.log("%cactiveted", "color:red", self.id)
		return true
	}

	function tryDeactivate() {
		// xx console.log("%ctry deactivate", "color:red", self.id, cleaner, base.listenerCount)
		if (!cleaner) return false
		if (base.listenerCount > 0) return false
		// xx console.log("%cdeactivating", "color:red", self.id)
		signalSyncContextStack.push(new Set())
		cleaner()
		signalSyncContextStack.pop()
		cleaner = null
		// xx console.log("%cdeactivated", "color:red", self.id)
		return true
	}

	const self: SignalReadable<T> = {
		get id() {
			return base.id
		},
		get listenerCount() {
			return base.listenerCount
		},
		get(silent) {
			if (tryActivate()) setTimeout(tryDeactivate, 5000)
			if (!silent && signalSyncContextStack.length > 0) signalSyncContextStack[signalSyncContextStack.length - 1]!.add(self)
			return base.get(true)
		},
		get ref() {
			return self.get()
		},
		subscribe(listener, options) {
			tryActivate()
			const subscription = base.subscribe(listener, options)
			return {
				unsubscribe: () => {
					// xx console.log("%cunsubscribing readable", "color:orange", listener, "from", self.id)
					subscription.unsubscribe()
					tryDeactivate()
				},
			}
		},
		subscribe$(node, listener, options) {
			let subscription: SignalSubscription
			onMount$(node, () => {
				subscription = self.subscribe(listener, options)
			})
			onUnmount$(node, () => subscription.unsubscribe())
		},
		signal() {
			base.signal()
		},
	}
	readables.add(self)
	return self
}
