import type { SignalReadable } from "./index"
import { createSignalReadable, isSignalReadable } from "./index"

// TODO: Make types better later, hardly works

/* type FromTypeString<T> = T extends "string"
	? string
	: T extends "number"
	? number
	: T extends "bigint"
	? bigint
	: T extends "boolean"
	? boolean
	: T extends "symbol"
	? symbol
	: T extends "undefined"
	? undefined
	: T extends "function"
	? (...args: unknown[]) => any
	: T extends "object"
	? object
	: unknown

type ToTypeString<T> = T extends string
	? "string"
	: T extends number
	? "number"
	: T extends bigint
	? "bigint"
	: T extends boolean
	? "boolean"
	: T extends symbol
	? "symbol"
	: T extends undefined
	? "undefined"
	: T extends (...args: unknown[]) => any
	? "function"
	: T extends object
	? "object"
	: "unknown"
 */
type Excludable<T> = T extends bigint
	? bigint extends T
		? false
		: true
	: T extends number
	? number extends T
		? false
		: true
	: T extends string
	? string extends T
		? false
		: true
	: T extends symbol
	? symbol extends T
		? false
		: true
	: T extends boolean
	? boolean extends T
		? false
		: true
	: T extends (...args: unknown[]) => any
	? ((...args: unknown[]) => any) extends T
		? false
		: true
	: T extends undefined
	? true
	: T extends null
	? true
	: false

type Prettify<T> = T extends object ? { [K in keyof T]: T[K] } & {} : T
type DeepOptional<T> = T extends object ? { [K in keyof T]?: DeepOptional<T[K]> } & {} : T

type Narrow<T, U> = Excludable<U> extends true ? Exclude<T, U> : T
type NoNever<T> = T extends object ? ({ [K in keyof T]: [T[K]] extends [never] ? 0 : 1 }[keyof T] extends 1 ? T : never) : T
type NarrowWithPattern<T, U> = Prettify<
	U extends object ? (keyof U extends keyof T ? T & { [K in keyof U]: NarrowWithPattern<T[K], U[K]> } & {} : T) : Narrow<T, U>
>

function matchPattern<TValue, const TPattern extends DeepOptional<TValue>>(value: TValue, pattern: TPattern): value is TValue & TPattern {
	if (typeof value !== typeof pattern) return false
	const patternAsAny = pattern as any
	if (typeof value === "object") {
		if (value !== null) {
			for (const key of Object.keys(patternAsAny) as (keyof TValue)[]) {
				if (!(key in value)) return false
				if (!matchPattern(value[key], patternAsAny[key])) return false
			}
		}
	} else return value === patternAsAny
	return true
}

type SwitchValueBuilder<TValue, TPatternFull = never, TReturns = never> = {
	match<const TPattern extends DeepOptional<TValue>, TResult>(
		pattern: TPattern,
		then: (value: TValue & TPattern) => TResult
	): SwitchValueBuilder<TValue, TPatternFull extends never ? TPattern : TPatternFull & TPattern, TReturns | TResult>
} & SwitchValueBuilder.Default<TValue, TReturns>
namespace SwitchValueBuilder {
	export type Default<TValue, TReturns> = [TValue] extends [never]
		? {
				default(): TReturns
		  }
		: {
				default<TDefault>(fallback: (value: TValue) => TDefault): TReturns | TDefault
		  }
}

function switchValue<TValue>(value: TValue): SwitchValueBuilder<TValue> {
	const cases: {
		pattern: Partial<TValue>
		then: (value: TValue) => unknown
	}[] = []

	// Builder type is way too funky, so gotta act like it doesn't exist here
	const result = {
		match(pattern: Partial<TValue>, then: (value: TValue) => unknown) {
			cases.push({ pattern, then })
			return result
		},
		default(fallback?: (value: TValue) => unknown) {
			for (const case_ of cases) {
				if (matchPattern(value, case_.pattern as any)) return case_.then(value)
			}

			if (fallback) return fallback(value)
			return null
		},
	}
	// Yup, this is a hack, type is way to funky to get right
	return result as never
}

type SwitchValueSignalBuilder<TValue, TPatternFull = never, TReturns = never> = {
	match<const TPattern extends Partial<TValue>, TResult>(
		pattern: TPattern,
		then: (value: SignalReadable<TValue & TPattern>) => TResult
	): SwitchValueSignalBuilder<TValue, [TPatternFull] extends [never] ? TPattern : TPatternFull & TPattern, TReturns | TResult>
} & SwitchValueSignalBuilder.Default<NarrowWithPattern<TValue, TPatternFull>, TReturns>
namespace SwitchValueSignalBuilder {
	export type Default<TValue, TReturns> = [TValue] extends [never]
		? {
				default(): SignalReadable<TReturns>
		  }
		: {
				default<TDefault>(fallback: (value: SignalReadable<TValue>) => TDefault): SignalReadable<TReturns | TDefault>
		  }
}

function switchValueSignal<TValue>(signal: SignalReadable<TValue>): SwitchValueSignalBuilder<TValue> {
	const cases: {
		pattern: Partial<TValue>
		then: (value: SignalReadable<TValue>) => unknown
	}[] = []

	// Builder type is way too funky, so gotta act like it doesn't exist here
	const result = {
		match(pattern: Partial<TValue>, then: (value: SignalReadable<TValue>) => unknown) {
			cases.push({ pattern, then })
			return result
		},
		default(fallback?: (value: SignalReadable<TValue>) => unknown) {
			return createSignalReadable<unknown>((set) => {
				let currentIndex = -1

				return signal.subscribe(
					(signalValue) => {
						if (currentIndex >= 0 && matchPattern(signalValue, cases[currentIndex]!.pattern as any)) return

						for (let i = 0; i < cases.length; i++) {
							if (i === currentIndex) continue
							const case_ = cases[i]!
							if (matchPattern(signalValue, case_.pattern as any)) {
								currentIndex = i
								return set(case_.then(signal))
							}
						}
						currentIndex = -1

						if (fallback) return set(fallback(signal))
						throw new Error("No default case provided and no case matched, this is not supposed to happen")
					},
					{ mode: "immediate" }
				).unsubscribe
			})
		},
	}
	// Yup, this is a hack, type is way to funky to get right
	return result as never
}

export const createSwitch: {
	<T>(value: SignalReadable<T>): SwitchValueSignalBuilder<T>
	<T>(value: T): SwitchValueBuilder<T>
} = <T>(value: T | SignalReadable<T>) => {
	if (isSignalReadable(value)) return switchValueSignal(value) as never
	return switchValue(value) as never
}
