import { derive } from "./derive"
import { SignalReadable } from "./readable"

function isWhenSignal<T>(when: unknown): when is SignalReadable<T> {
	return when instanceof SignalReadable
}

interface WhenSignal<T extends unknown> {
	is<Is extends unknown>(
		is: Is
	): {
		then<Then>(then: (value: SignalReadable<Is>) => Then): {
			otherwise<Else>(otherwise: (value: SignalReadable<Exclude<T, Is>>) => Else): SignalReadable<Then | Else>
		}
	}
}

interface When<T extends unknown> {
	is<Is extends unknown>(
		is: Is
	): {
		then<Then>(then: (value: Is) => Then): {
			otherwise<Else>(otherwise: (value: Exclude<T, Is>) => Else): Then | Else
		}
	}
}

export function when<T extends SignalReadable<unknown> | unknown>(
	when: T
): T extends SignalReadable<infer T> ? (T extends unknown ? WhenSignal<T> : never) : T extends unknown ? When<T> : never {
	if (isWhenSignal(when)) {
		return {
			is(is: unknown) {
				return {
					then<Then>(then: () => Then) {
						return {
							otherwise<Else>(otherwise: () => Else) {
								return derive((s) => {
									const w = s(when).ref
									return w === is ? then() : otherwise()
								})
							},
						}
					},
				}
			},
		} as any
	}

	return {
		is(is: unknown) {
			return {
				then<Then>(then: () => Then) {
					return {
						otherwise<Else>(otherwise: () => Else) {
							return when === is ? then() : otherwise()
						},
					}
				},
			}
		},
	} as any
}
