import type { SignalReadable } from "."
import { createSignalReadable, isSignalReadable } from "."
import { DeepOptional, Fn, NoNever, NotEquals, PrimitiveType, ReferanceType } from "../utils/type"

// TODO: Make typing better
// TODO: Add instanceof support
// TODO: Add typeof support

export const TYPEOF = Symbol()
export type TYPEOF = typeof TYPEOF
export const INSTANCEOF = Symbol()
export type INSTANCEOF = typeof INSTANCEOF

type TypeString = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"
type TypeStringToType<T extends TypeString> = T extends "string"
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
	: T extends "object"
	? object | null
	: T extends "function"
	? Fn
	: unknown

type Exhaust<Type, Exhauster> = CanExhaust<Exhauster> extends true ? Exclude<Type, Exhauster> : Type

// Since we supply match with a value, we get the type from the value, so value always has a valid value
// But on type side we might now know the exact value that the match is supplied with.
// So if the exhauster is a reference type or a non-literal primitive type,
// 	we can't exhaust it, because we don't know the exact value
type CanExhaust<Exhauster> = [Exhauster] extends [never]
	? false
	: [
			NotEquals<Exhauster, boolean>,
			NotEquals<Exhauster, string>,
			NotEquals<Exhauster, number>,
			NotEquals<Exhauster, bigint>,
			NotEquals<Exhauster, symbol>
	  ][number] extends true
	? Exhauster extends ReferanceType
		? false
		: true
	: false

false satisfies CanExhaust<never>
true satisfies CanExhaust<undefined>
true satisfies CanExhaust<null>
false satisfies CanExhaust<string>
false satisfies CanExhaust<number>
false satisfies CanExhaust<bigint>
false satisfies CanExhaust<boolean>
false satisfies CanExhaust<symbol>
false satisfies CanExhaust<() => void>
false satisfies CanExhaust<{}>
false satisfies CanExhaust<{ a: 1 }>
false satisfies CanExhaust<string & { a: 1; b: 2 }>
false satisfies CanExhaust<[1, 2, 3]>
true satisfies CanExhaust<"a">
true satisfies CanExhaust<1>
true satisfies CanExhaust<true>
true satisfies CanExhaust<1n>

// Exhaust with pattern lets use exhaust with the reference types and non-literal primitive types
// 	with pattern matching
type ExhaustWithPattern<Type, Pattern> = Pattern extends PrimitiveType
	? Exhaust<Type, Pattern>
	: NoNever<
			keyof Pattern extends INSTANCEOF | TYPEOF
				? {
						[K in keyof Pattern]: K extends INSTANCEOF
							? Pattern[K] extends { new (...args: any[]): infer T }
								? Exclude<Type, T>
								: never
							: K extends TYPEOF
							? Pattern[K] extends TypeString
								? Exclude<Type, TypeStringToType<Pattern[K]>>
								: never
							: never
				  }[keyof Pattern]
				: keyof Pattern extends keyof Type
				? Type & { [K in keyof Pattern]: ExhaustWithPattern<Type[K], Pattern[K]> }
				: never
	  >

type PatternOf<TValue> = TValue extends PrimitiveType
	? TValue
	: TValue extends object
	?
			| { [K in keyof TValue]?: PatternOf<TValue[K]> }
			| {
					[TYPEOF]: TypeString
			  }
			| {
					[INSTANCEOF]: { new (...args: any[]): any }
			  }
	: TValue

type Narrow<TValue, TPattern> = INSTANCEOF extends keyof TPattern
	? TPattern[INSTANCEOF] extends { new (...args: any[]): infer T }
		? Extract<TValue, T>
		: never
	: TYPEOF extends keyof TPattern
	? TPattern[TYPEOF] extends TypeString
		? Extract<TValue, TypeStringToType<TPattern[TYPEOF]>>
		: never
	: TValue & TPattern

function matchPattern<TValue, const TPattern extends PatternOf<TValue>>(value: TValue, pattern: TPattern): value is TValue & TPattern {
	if (typeof pattern === "object" && pattern !== null) {
		for (const key of Object.keys(pattern as any) as (keyof TPattern)[]) {
			const patternValue = pattern[key]
			if (key === TYPEOF && patternValue !== typeof value) return false
			if (key === INSTANCEOF && typeof patternValue === "function" && !(value instanceof patternValue)) return false

			if (typeof value !== "object" || value === null) return false
			if (!(key in value)) return false
			return matchPattern(value[key as keyof TValue], patternValue as any)
		}
	} else return value === (pattern as any)
	return true
}

type SwitchValueBuilder<TValue, TReturns = never> = {
	match<const TPattern extends PatternOf<TValue>, TResult>(
		pattern: TPattern,
		then: (value: Narrow<TValue, TPattern>) => TResult
	): SwitchValueBuilder<ExhaustWithPattern<TValue, TPattern>, TReturns | TResult>
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
		pattern: DeepOptional<TValue>
		then: (value: TValue) => unknown
	}[] = []

	// Builder type is way too funky, so gotta act like it doesn't exist here
	const result = {
		match(pattern: DeepOptional<TValue>, then: (value: TValue) => unknown) {
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

type SwitchValueSignalBuilder<TValue, TReturns = never> = {
	match<const TPattern extends PatternOf<TValue>, TResult>(
		pattern: TPattern,
		then: (value: SignalReadable<Narrow<TValue, TPattern>>) => TResult
	): SwitchValueSignalBuilder<ExhaustWithPattern<TValue, TPattern>, TReturns | TResult>
} & SwitchValueSignalBuilder.Default<TValue, TReturns>
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
		pattern: DeepOptional<TValue>
		then: (value: SignalReadable<TValue>) => unknown
	}[] = []

	// Builder type is way too funky, so gotta act like it doesn't exist here
	const result = {
		match(pattern: DeepOptional<TValue>, then: (value: SignalReadable<TValue>) => unknown) {
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
