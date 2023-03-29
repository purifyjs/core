import type { Renderable } from "../template"
import { createReadable, SignalReadable } from "./readable"

type Excludable<T, Then, Else> = T extends number
	? number extends T
		? Else
		: Then
	: T extends string
	? string extends T
		? Else
		: Then
	: T extends symbol
	? symbol extends T
		? Else
		: Then
	: T extends boolean
	? boolean extends T
		? Else
		: Then
	: T extends Function
	? Function extends T
		? Else
		: Then
	: T extends null
	? Then
	: T extends undefined
	? Then
	: Else

type Then<T> = (value: T) => unknown
type Switch<TValue, TReturns = never> = {
	case<TCase extends TValue, TThen extends Then<TCase>>(
		value: TCase,
		then: TThen
	): Switch<Excludable<TCase, Exclude<TValue, TCase>, TValue>, TReturns | ReturnType<TThen>>
	default<TDefault extends Then<TValue>>(fallback: TDefault): ReturnType<Switch<TValue, TReturns | ReturnType<TDefault>>["render"]>
} & Renderable<TReturns>

type SwitchSignal<TValue, TReturns = never> = {
	case<TCase extends TValue, TThen extends Then<TCase>>(
		value: TCase,
		then: TThen
	): SwitchSignal<Excludable<TCase, Exclude<TValue, TCase>, TValue>, TReturns | ReturnType<TThen>>
	default<TDefault extends Then<SignalReadable<TValue>>>(
		fallback: TDefault
	): ReturnType<SwitchSignal<TValue, TReturns | ReturnType<TDefault>>["render"]>
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
			return this.render()
		},
		render(): never {
			delete (self as Partial<typeof this>).case
			delete (self as Partial<typeof this>).default
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
			fallbackCase = fallback
			return this.render() as never
		},
		render() {
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
