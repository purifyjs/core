import { mountableNodeAssert } from "../mountable"
import { valueToNode } from "../template/node"
import { Renderable, RenderSymbol } from "../template/renderable"
import { randomId } from "../utils/id"

// TODO: Rewrite this and also SignalWritable, Writable shouldnt have methods it doesnt need to. Also simplify the code more, you might put writable and readable in the same file too
// TODO: Avoid infinete loops with a warning message
// TODO: I probably have to rewrite all signals and logics
// Not gonna use classes because they are less flexable with funky typescript stuff
// might use Master-Ts composition because i still wanna use instanceof keyword
// If i can make this like derive and remove the need for derive seperaterly that would be great, also easier to flow dependencies, which would let use stop infite loops easier

export type SignalSubscription = {
	unsubscribe(): void
}
export type SignalSubscriptionListener<T> = {
	<U extends T>(value: U): unknown
}
export type SignalSubscriptionOptions = {
	mode: "normal" | "once" | "immediate"
}

export type SignalSetter<T> = {
	<U extends T>(value: U): void
}

export type SignalUpdater<T> = {
	(set: SignalSetter<T>, signal: SignalReadable<T>["signal"]): Function
}

export function createReadable<T>(...params: ConstructorParameters<typeof SignalReadable<T>>) {
	return new SignalReadable<T>(...params)
}

export const SyncContextStackSymbol = Symbol()

export class SignalReadable<T = unknown> implements Renderable<DocumentFragment> {
	public static [SyncContextStackSymbol]: Set<SignalReadable>[] = []

	public readonly id
	private readonly _listeners: Set<SignalSubscriptionListener<T>>
	private _value: T
	private _updater: SignalUpdater<T> | null
	private _cleaner: Function | null = null
	private forwards: { subscription: SignalSubscription | null; signal: SignalReadable<T> | null } = { signal: null, subscription: null }

	constructor(updater: SignalUpdater<T> | null = null, initial?: T) {
		this.id = randomId()
		this._listeners = new Set()
		this._value = initial!
		this._updater = updater
	}

	public readonly get = (): T => {
		if (this._updater && !this._cleaner) {
			this._activate()
			setTimeout(() => this._checkActive(), 5000)
		}
		SignalReadable[SyncContextStackSymbol][SignalReadable[SyncContextStackSymbol].length - 1]?.add(this as SignalReadable<unknown>)
		if (this._value instanceof SignalReadable) return this._value.ref
		return this._value
	}

	protected readonly _set: SignalSetter<T> = (value) => {
		if (value === this._value) return
		this._value = value
		this.forwards.subscription?.unsubscribe()
		this.forwards.subscription ??= null
		this.forwards.signal ??= null
		if (value instanceof SignalReadable) {
			this.forwards.signal = value
			this.forwards.subscription = value.subscribe(this.signal)
		}
		this.signal()
	}

	public get ref() {
		return this.get()
	}

	public readonly subscribe = (listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions): SignalSubscription => {
		// xx console.log("%csubscribed", "color:orange", listener.name, "to", this.id)
		this._activate()
		switch (options?.mode) {
			case "once":
				const onceCallback = () => {
					listener(this.get())
					this._listeners.delete(onceCallback)
				}
				this._listeners.add(onceCallback)
				break
			case "immediate":
				listener(this.get())
			case "normal":
			default:
				this._listeners.add(listener)
				break
		}
		return {
			unsubscribe: () => {
				// xx console.log("%cunsubscribed", "color:orange", listener.name, "from", this.id)
				this._listeners.delete(listener)
				this._checkActive()
			},
		}
	}

	private _signaling = false

	public readonly signal = () => {
		// xx console.log("%csignaling", "color:yellow", this.id, this._value)
		if (this._signaling) throw new Error("Avoided recursive signal")
		this._signaling = true
		try {
			this._listeners.forEach((callback) => callback(this.get()))
		} catch (error) {
			throw error
		} finally {
			this._signaling = false
		}
	}

	protected readonly _checkActive = () => {
		if (this._listeners.size === 0) this._deactivate()
	}

	protected readonly _activate = () => {
		if (!this._updater) return
		if (this._cleaner) return
		this._cleaner = this._updater(this._set, this.signal)

		if (this.forwards.signal) {
			this.forwards.subscription = this.forwards.signal.subscribe(this.signal)
		}
		// xx console.log("%cactivated", "color:yellow", this.id, this._value)
	}

	protected readonly _deactivate = () => {
		if (!this._updater) return
		if (!this._cleaner) return
		this._cleaner()
		this._cleaner = null

		if (this.forwards.subscription) {
			this.forwards.subscription.unsubscribe()
			this.forwards.subscription = null
		}
		// xx console.log("%cdeactivated", "color:yellow", this.id, this._value)
	}

	public readonly [RenderSymbol] = () => {
		const fragment = document.createDocumentFragment()
		const startComment = document.createComment(`signal ${this.id}`)
		const endComment = document.createComment(`/signal ${this.id}`)
		fragment.append(startComment, endComment)

		mountableNodeAssert(startComment)
		startComment.$subscribe(
			this,
			(signalValue) => {
				// TODO: find out why we don't have nextSibiling sometimes, why we are not in the dom
				while (startComment.nextSibling && startComment.nextSibling !== endComment) startComment.nextSibling.remove()
				endComment.before(valueToNode(signalValue))
			},
			{ mode: "immediate" }
		)

		return fragment
	}
}
