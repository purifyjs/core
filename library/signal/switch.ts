import { createDerive, SignalDeriver } from "./derive"
import type { SignalReadable } from "./readable"

interface Switch<Returns> {
	case<Case, Then extends () => unknown>(case_: Case, then: Then): Switch<Returns | ReturnType<Then>>
	default<Default extends () => unknown>(default__?: Default): SignalReadable<Returns | ReturnType<Default>>
}

export function createSwitch<T extends SignalDeriver<unknown>>(switch_: T) {
	const map = new Map()
	return {
		case<Case, Then extends () => unknown>(case_: Case, then: Then) {
			map.set(case_, then)
			return this
		},
		default<Default extends () => unknown>(default__?: Default) {
			return createDerive((s) => map.get(switch_(s))?.() ?? default__?.() ?? null)
		},
	} as Switch<never>
}
