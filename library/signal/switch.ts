import { createDerive } from "./derive"
import { SignalReadable } from "./readable"

type IsLiteral<T, Then, Else> = T extends number
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
	: Else

type ThenUnknown = () => unknown

type Switch<T, Returns, IsSignal extends boolean> = {
	case<Case extends T, Then extends ThenUnknown>(
		value: Case,
		then: Then
	): Switch<IsLiteral<Case, Exclude<T, Case>, T>, Returns | ReturnType<Then>, IsSignal>
	$<Default extends ThenUnknown>(
		...fallback: T extends never ? never : [Default]
	): Default extends unknown
		? IsSignal extends true
			? SignalReadable<Returns>
			: Returns
		: IsSignal extends true
		? SignalReadable<Returns | ReturnType<Default>>
		: Returns | ReturnType<Default>
}

export function createSwitch<T>(value: T): Switch<T extends SignalReadable<infer U> ? U : T, never, T extends SignalReadable<any> ? true : false> {
	const cases = new Map<unknown, ThenUnknown>()
	return {
		case(value, then) {
			cases.set(value, then)
			return this as never
		},
		$(fallback?: ThenUnknown) {
			if (value instanceof SignalReadable) return createDerive((s) => cases.get(s(value).ref)?.() ?? fallback?.() ?? null) as never
			return (cases.get(value)?.() ?? fallback?.() ?? null) as never
		},
	}
}
