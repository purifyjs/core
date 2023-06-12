import type { SignalReadable } from "../signal"
import { createSignalReadable, isSignalReadable } from "../signal"
import type { Renderable } from "../template/renderable"
import { RenderSymbol } from "../template/renderable"
import type { Excludable } from "../utils/type"

type Then<T> = (value: T) => unknown
type Match<TValue, TReturns = unknown> = {
	case<TCase extends TValue, TThen extends Then<TCase>>(
		value: TCase,
		then: TThen
	): Match<Excludable<TCase, Exclude<TValue, TCase>, TValue>, TReturns | ReturnType<TThen>>
	default<TDefault extends Then<TValue>>(
		fallback: [TValue] extends [never] ? void : TDefault
	): TReturns | ([TValue] extends [never] ? never : ReturnType<TDefault>)
} & ([TValue] extends [never] ? Renderable<TReturns> : {})

type MatchSignal<TValue, TReturns = never> = {
	case<TCase extends TValue, TThen extends Then<TCase>>(
		value: TCase,
		then: TThen
	): MatchSignal<Excludable<TCase, Exclude<TValue, TCase>, TValue>, TReturns | ReturnType<TThen>>
	default<TDefault extends Then<SignalReadable<TValue>>>(
		fallback: [TValue] extends [never] ? void : TDefault
	): SignalReadable<TReturns | ([TValue] extends [never] ? never : ReturnType<TDefault>)>
} & ([TValue] extends [never] ? Renderable<SignalReadable<TReturns>> : {})

function switchValue<T>(value: T): Match<T> {
	const cases = new Map<unknown, Then<unknown>>()
	let fallbackCase: Then<T> | null = null

	return {
		case(value, then) {
			cases.set(value, then as Then<unknown>)
			return this as never
		},
		default(fallback: Then<T> | void) {
			fallbackCase = fallback ?? null
			return (this as any)[RenderSymbol]()
		},
		[RenderSymbol]() {
			const then = cases.get(value)
			if (then) return then(value) as never
			if (fallbackCase) return fallbackCase(value) as never
			return null as never
		},
	}
}

function switchSignal<T>(value: SignalReadable<T>): MatchSignal<T> {
	const cases = new Map<unknown, Then<unknown>>()
	let fallbackCase: Then<SignalReadable<T>> | null = null
	return {
		case(value, then) {
			cases.set(value, then as Then<unknown>)
			return this as never
		},
		default(fallback) {
			fallbackCase = fallback ?? null
			return (this as any)[RenderSymbol]()
		},
		[RenderSymbol]() {
			delete (this as Partial<typeof this>).case
			delete (this as Partial<typeof this>).default
			return createSignalReadable<unknown>((set) => {
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

export const createMatch: {
	<T>(value: SignalReadable<T>): MatchSignal<T>
	<T>(value: T): Match<T>
} = <T>(value: T | SignalReadable<T>) => {
	if (isSignalReadable(value)) return switchSignal(value) as never
	return switchValue(value) as never
}
