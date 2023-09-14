import type { Signal } from "master-ts/core.ts"
import { signal } from "master-ts/core.ts"

// TODO: Just copy pasted this from the old master-ts. Make it smaller and better later.

export const TYPEOF = Symbol()
export type TYPEOF = typeof TYPEOF

export const INSTANCEOF = Symbol()
export type INSTANCEOF = typeof INSTANCEOF

// Since we supply match with a value, we get the type from the value, so value always has a valid value
// But on type side we might not know the exact value that the match is supplied with.
// So if the exhauster is a reference type or a non-literal primitive type,
// 	we can't exhaust it, because we don't know the exact value
type CanExhaust<TExhauster> = [TExhauster] extends [never]
	? false
	: [
			Utils.NotEquals<TExhauster, boolean>,
			Utils.NotEquals<TExhauster, number>,
			Utils.NotEquals<TExhauster, bigint>,
			Utils.NotEquals<TExhauster, string>,
			Utils.NotEquals<TExhauster, symbol>
	  ][number] extends true
	? TExhauster extends Utils.ReferanceType
		? false
		: true
	: false

// Some inline type tests
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
type Exhaust<TType, TExhauster> = CanExhaust<TExhauster> extends true ? Exclude<TType, TExhauster> : TType
type ExhaustWithPattern<TType, TPattern> = TPattern extends Utils.PrimitiveType
	? Exhaust<TType, TPattern>
	: Utils.NoNever<
			keyof TPattern extends INSTANCEOF | TYPEOF
				? {
						[K in keyof TPattern]: K extends INSTANCEOF
							? TPattern[K] extends { new (...args: any[]): infer T }
								? Exclude<TType, T>
								: never
							: K extends TYPEOF
							? TPattern[K] extends Utils.TypeString
								? Exclude<TType, Utils.TypeStringToType<TPattern[K]>>
								: never
							: never
				  }[keyof TPattern]
				: keyof TPattern extends keyof TType
				? TType & { [K in keyof TPattern]: ExhaustWithPattern<TType[K], TPattern[K]> }
				: never
	  >

type PatternOf<TValue> =
	| (TValue extends Utils.PrimitiveType
			? TValue
			: TValue extends object
			?
					| { [K in keyof TValue]?: PatternOf<TValue[K]> }
					| {
							[INSTANCEOF]: { new (...args: any[]): TValue }
					  }
			: TValue)
	| {
			[TYPEOF]: Utils.TypeToTypeString<TValue>
	  }

type Narrow<TValue, TPattern> = INSTANCEOF extends keyof TPattern
	? TPattern[INSTANCEOF] extends { new (...args: any[]): infer T }
		? Extract<TValue, T>
		: never
	: TYPEOF extends keyof TPattern
	? TPattern[TYPEOF] extends Utils.TypeString
		? Extract<TValue, Utils.TypeStringToType<TPattern[TYPEOF]>>
		: never
	: TValue & TPattern

function isObject(value: any): value is object {
	return typeof value === "object" && value !== null
}

function matchPattern<TValue, const TPattern extends PatternOf<TValue>>(
	value: TValue,
	pattern: TPattern
): value is TValue & TPattern {
	if (!isObject(pattern)) return value === (pattern as never)

	if (TYPEOF in pattern) {
		if (pattern[TYPEOF] !== typeof value) return false
	} else if (INSTANCEOF in pattern) {
		if (typeof pattern[INSTANCEOF] !== "function") return false
		if (!(value instanceof pattern[INSTANCEOF])) return false
	} else {
		for (const key of Object.keys(pattern) as (keyof TPattern)[]) {
			const patternValue = pattern[key]

			if (!isObject(value)) return false
			if (!(key in value)) return false
			if (!matchPattern(value[key as keyof TValue], patternValue as never)) return false
		}
	}
	return true
}

type MatchBuilder<TValue, TReturns = never> = {
	case<const TPattern extends PatternOf<TValue>, TResult>(
		pattern: TPattern,
		then: (value: Readonly<Signal<Narrow<TValue, TPattern>>>) => TResult
	): MatchBuilder<ExhaustWithPattern<TValue, TPattern>, TReturns | TResult>
} & MatchBuilder.Default<TValue, TReturns>
namespace MatchBuilder {
	export type Default<TValue, TReturns> = [TValue] extends [never]
		? {
				default(): Readonly<Signal<TReturns>>
		  }
		: {
				default<TDefault>(
					fallback: (value: Readonly<Signal<TValue>>) => TDefault
				): Readonly<Signal<TReturns | TDefault>>
		  }
}

export function match<TValue>(valueSignal: Readonly<Signal<TValue>>): MatchBuilder<TValue> {
	let cases: {
		pattern: Utils.DeepOptional<TValue>
		then: (value: Readonly<Signal<TValue>>) => unknown
	}[] = []

	// Builder type is way too funky, so gotta act like it doesn't exist here
	let self = {
		case: (pattern: Utils.DeepOptional<TValue>, then: (value: Readonly<Signal<TValue>>) => unknown) => (
			cases.push({ pattern, then }), self
		),
		default: (fallback?: (value: Readonly<Signal<TValue>>) => unknown) =>
			signal<unknown>(undefined, (set) => {
				let currentIndex = -1
				return valueSignal.follow(
					(signalValue) => {
						if (currentIndex >= 0 && matchPattern(signalValue, cases[currentIndex]!.pattern as never))
							return

						for (let i = 0; i < cases.length; i++) {
							if (i === currentIndex) continue
							const case_ = cases[i]!
							if (matchPattern(signalValue, case_.pattern as never)) {
								currentIndex = i
								return set(case_.then(valueSignal))
							}
						}
						currentIndex = -1

						return set(fallback?.(valueSignal))
					},
					{ mode: "immediate" }
				).unfollow
			})
	}
	// Yup, this is a hack, type is way to funky to get right
	return self as never
}
