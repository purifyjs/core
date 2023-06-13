import { onMount, onUnmount } from "../lifecycle/index"
import { SignalReadable, SignalSubscription } from "./index"

export function createEffect<T extends SignalReadable<any>[]>(callback: () => any, signals: T): SignalSubscription {
	const subscriptions: SignalSubscription[] = new Array(signals.length)

	for (let i = 0; i < signals.length; i++) subscriptions[i] = signals[i]!.subscribe(callback)
	callback()

	return {
		unsubscribe() {
			subscriptions.forEach((subscription) => subscription.unsubscribe())
		},
	}
}

export function createEffect$<T extends SignalReadable<any>[]>(node: Node, callback: () => any, signals: T) {
	const subscriptions: SignalSubscription[] = new Array(signals.length)

	onMount(node, () => {
		for (let i = 0; i < signals.length; i++) subscriptions[i] = signals[i]!.subscribe(callback)
		callback()
	})
	onUnmount(node, () => {
		subscriptions.forEach((subscription) => subscription.unsubscribe())
	})
}
