import { createDerive } from "./derive"
import { SignalReadable } from "./readable"

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

type ThenBase<Value> = (value: Value) => unknown

type Switch<Value, Returns, IsSignal extends boolean> = {
	case<Case extends Value, Then extends ThenBase<Value>>(
		value: Case,
		then: Then
	): Switch<Excludable<Case, Exclude<Value, Case>, Value>, Returns | ReturnType<Then>, IsSignal>
	$<Default extends ThenBase<Value>>(
		...fallback: Value extends never ? never : [Default]
	): Default extends unknown
		? IsSignal extends true
			? SignalReadable<Returns>
			: Returns
		: IsSignal extends true
		? SignalReadable<Returns | ReturnType<Default>>
		: Returns | ReturnType<Default>
}

export function createSwitch<Value>(
	value: Value
): Switch<Value extends SignalReadable<infer U> ? U : Value, never, Value extends SignalReadable<any> ? true : false> {
	const cases = new Map<unknown, ThenBase<any>>()
	return {
		case(value, then) {
			cases.set(value, then)
			return this as never
		},
		$(fallback?: ThenBase<any>): never {
			if (value instanceof SignalReadable)
				return createDerive(() => {
					const then = cases.get(value.ref)
					if (!then) return fallback?.(value.ref) ?? null
					return then(value.ref)
				}) as never
			const then = cases.get(value)
			if (!then) return (fallback?.(value) ?? null) as never
			return then(value) as never
		},
	}
}
