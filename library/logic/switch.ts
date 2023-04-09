import { createReadable, SignalReadable } from "../signal/readable"
import { Renderable, RenderSymbol } from "../template/renderable"
import type { Excludable } from "../utils/type"

// TODO: Try to fix types, if posibble

type Then<T> = (value: T) => unknown
type Switch<TValue, TReturns = never> = {
	case<TCase extends TValue, TThen extends Then<TCase>>(
		value: TCase,
		then: TThen
	): Switch<Excludable<TCase, Exclude<TValue, TCase>, TValue>, TReturns | ReturnType<TThen>>
	default<TDefault extends Then<TValue>>(fallback: TDefault): Omit<Switch<never, TReturns | ReturnType<TDefault>>, string>
} & Renderable<TReturns>

type SwitchSignal<TValue, TReturns = never> = {
	case<TCase extends TValue, TThen extends Then<TCase>>(
		value: TCase,
		then: TThen
	): SwitchSignal<Excludable<TCase, Exclude<TValue, TCase>, TValue>, TReturns | ReturnType<TThen>>
	default<TDefault extends Then<SignalReadable<TValue>>>(fallback: TDefault): Omit<SwitchSignal<never, TReturns | ReturnType<TDefault>>, string>
} & Renderable<SignalReadable<TReturns>>

function switchValue<T>(value: T): Switch<T> {
	const cases = new Map<unknown, Then<unknown>>()
	let fallbackCase: Then<T> | null = null

	return {
		case(value, then) {
			cases.set(value, then as Then<unknown>)
			return this
		},
		default(fallback: Then<T>) {
			fallbackCase = fallback
			return this
		},
		[RenderSymbol](): never {
			const then = cases.get(value)
			if (then) return then(value) as never
			if (fallbackCase) return fallbackCase(value) as never
			return null as never
		},
	}
}

function switchSignal<T>(value: SignalReadable<T>): SwitchSignal<T> {
	const cases = new Map<unknown, Then<unknown>>()
	let fallbackCase: Then<SignalReadable<T>> | null = null
	return {
		case(value, then) {
			cases.set(value, then as Then<unknown>)
			return this as never
		},
		default(fallback) {
			delete (this as Partial<typeof this>).case
			delete (this as Partial<typeof this>).default
			fallbackCase = fallback
			return this as never
		},
		[RenderSymbol]() {
			delete (this as Partial<typeof this>).case
			delete (this as Partial<typeof this>).default
			return createReadable<unknown>(null, (set) => {
				let isCurrentFallback = false
				return value.subscribe(
					(signalValue) => {
						const then = cases.get(signalValue)
						if (then) set(then(signalValue))
						else if (fallbackCase) {
							if (!isCurrentFallback) set(fallbackCase(value))
						} else set(null)
						isCurrentFallback = !then
					},
					{ mode: "immediate" }
				).unsubscribe
			}) as never
		},
	}
}

export const createSwitch: {
	<T>(value: SignalReadable<T>): SwitchSignal<T>
	<T>(value: T): Switch<T>
} = <T>(value: T | SignalReadable<T>) => {
	if (value instanceof SignalReadable<T>) return switchSignal(value) as never
	return switchValue(value) as never
}
