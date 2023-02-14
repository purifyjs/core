import { createDerive } from "./derive"
import { SignalReadable } from "./readable"

type ThenUnknown = () => unknown
type CaseUnknown = unknown
// type IfUnknown = (value: unknown) => unknown

interface Match<T extends SignalReadable<unknown> | unknown, Returns> {
	case<Case extends CaseUnknown, Then extends ThenUnknown>(case_: Case, then: Then): Match<T, Returns | ReturnType<Then>>
	// if<If extends IfUnknown, Then extends ThenUnknown>(if_: If, then_: Then): Switch<Returns | ReturnType<Then>>
	default<Default extends ThenUnknown>(
		default_?: Default
	): Default extends unknown
		? T extends SignalReadable<any>
			? SignalReadable<Returns>
			: Returns
		: T extends SignalReadable<any>
		? SignalReadable<Returns | ReturnType<Default>>
		: Returns | ReturnType<Default>
}

export function createMatch<T extends SignalReadable<unknown> | unknown>(match: T): Match<T, never> {
	const cases = new Map<CaseUnknown, ThenUnknown>()
	return {
		case(case_, then) {
			cases.set(case_, then)
			return this
		},
		default(default_) {
			if (match instanceof SignalReadable)
				return createDerive((s) => cases.get(s(match).ref)?.() ?? default_?.() ?? null) as SignalReadable<never>
			return (cases.get(match)?.() ?? default_?.() ?? null) as any
		},
	}
}
