export namespace Utils {
	export type Kebab<T extends string, A extends string = ""> = T extends `${infer F}${infer R}`
		? Kebab<R, `${A}${F extends Lowercase<F> ? "" : "-"}${Lowercase<F>}`>
		: A

	export type CanDecide<T, U> = boolean extends (T extends U ? true : false) ? false : true

	export type EmptyObject = { [K in PropertyKey]: never }

	type BuildTuple<L extends number, T extends any[] = []> = T extends {
		length: L
	}
		? T
		: BuildTuple<L, [...T, unknown]>

	export type Subtract<A extends number, B extends number> = A extends number
		? B extends number
			? BuildTuple<A> extends [...infer U, ...BuildTuple<B>]
				? U["length"]
				: never
			: never
		: never

	declare const ERROR: unique symbol
	type ERROR = typeof ERROR
	export type ErrorType<Message extends string> = { [ERROR]: Message }

	declare const BRAND: unique symbol
	type BRAND = typeof BRAND
	export type Brand<Name extends string, Type> = Type &
		(Type extends { [BRAND]: string } ? { [BRAND]: Type[BRAND] | Name } : { [BRAND]: Name })

	export type Equals<T, U> = (<G>() => G extends T ? 1 : 0) extends <G>() => G extends U ? 1 : 0 ? true : false
	export type NotEquals<T, U> = Equals<T, U> extends true ? false : true

	export type IsReadonly<T> = T extends { readonly [K in keyof T]: IsReadonly<T[K]> } ? true : false

	export type Prettify<T> = T extends object ? { [K in keyof T]: T[K] } & {} : T
	export type DeepOptional<T> = T extends object ? { [K in keyof T]?: DeepOptional<T[K]> } : T

	// We don't check if the `T is an object` because `string & {}` can exsist
	export type NoNever<T> = T extends PrimitiveType | Fn
		? T
		: NonNullable<{ [K in keyof T]: [T[K]] extends [never] ? 0 : 1 }[keyof T]> extends 1
		? T
		: never

	export type Fn = (...args: unknown[]) => any
	export type PrimitiveType = string | number | bigint | boolean | symbol | undefined | null
	export type ReferanceType = object | Fn

	export type TypeString = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function"
	export type TypeStringToType<T extends TypeString> = T extends "string"
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
		: never
	export type TypeToTypeString<T> = T extends string
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
		: T extends object | null
		? "object"
		: T extends Fn
		? "function"
		: never
}
