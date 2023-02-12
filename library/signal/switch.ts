import { createDerive, SignalDeriver } from "./derive"
import type { SignalReadable } from "./readable"

type ThenUnknown = () => unknown
type CaseUnknown = unknown
// type IfUnknown = (value: unknown) => unknown

interface Switch<Returns> {
	case<Case extends CaseUnknown, Then extends ThenUnknown>(case_: Case, then: Then): Switch<Returns | ReturnType<Then>>
	// if<If extends IfUnknown, Then extends ThenUnknown>(if_: If, then_: Then): Switch<Returns | ReturnType<Then>>
	default<Default extends ThenUnknown>(default_?: Default): SignalReadable<Returns | ReturnType<Default>>
}

export function createSwitch<T extends SignalDeriver<unknown>>(switch_: T): Switch<never> {
	const cases = new Map<CaseUnknown, ThenUnknown>()
	return {
		case(case_, then) {
			cases.set(case_, then)
			return this
		},
		default(default_) {
			return createDerive((s) => cases.get(switch_(s))?.() ?? default_?.() ?? null) as SignalReadable<never>
		},
	}
}
