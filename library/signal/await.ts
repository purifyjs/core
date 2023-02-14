import { createDerive, SignalDeriver } from "./derive"
import { createReadable } from "./readable"

export function createAwait<Awaited, Placeholder>(promiseDeriver: SignalDeriver<Promise<Awaited>>, placeholder?: Placeholder) {
	const signal = createDerive(promiseDeriver)
	return createReadable<Placeholder | Awaited | null>(placeholder ?? null, (set) => {
		let counter = 0
		return signal.subscribe(
			async (value) => {
				const id = ++counter
				if (placeholder !== undefined) set(placeholder)
				const result = await value
				if (id !== counter) return
				set(result)
			},
			{ mode: "immediate" }
		).unsubscribe
	})
}
