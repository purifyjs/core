import { createDerive } from "./derive"
import { SignalReadable } from "./readable"

type ThenUnknown = () => unknown
type CaseUnknown = unknown
// type IfUnknown = (value: unknown) => unknown

interface Switch<T extends SignalReadable<unknown> | unknown, Returns> {
	case<Case extends CaseUnknown, Then extends ThenUnknown>(value: Case, then: Then): Switch<T, Returns | ReturnType<Then>>
	// if<If extends IfUnknown, Then extends ThenUnknown>(if_: If, then_: Then): Switch<Returns | ReturnType<Then>>
	$<Default extends ThenUnknown>(
		fallback?: Default
	): Default extends unknown
		? T extends SignalReadable<any>
			? SignalReadable<Returns>
			: Returns
		: T extends SignalReadable<any>
		? SignalReadable<Returns | ReturnType<Default>>
		: Returns | ReturnType<Default>
}

export function createSwitch<T extends SignalReadable<unknown> | unknown>(match: T): Switch<T, never> {
	const cases = new Map<CaseUnknown, ThenUnknown>()
	return {
		case(value, then) {
			cases.set(value, then)
			return this
		},
		$(fallback) {
			if (match instanceof SignalReadable)
				return createDerive((s) => cases.get(s(match).ref)?.() ?? fallback?.() ?? null) as SignalReadable<never>
			return (cases.get(match)?.() ?? fallback?.() ?? null) as any
		},
	}
}
