declare const ERROR: unique symbol
type ERROR = typeof ERROR
export type ErrorType<Message extends string> = { [ERROR]: Message }

export const BRAND = Symbol()
export type BRAND = typeof BRAND
export type Brand<Name extends string, Type> = Type & (Type extends { [BRAND]: string } ? { [BRAND]: Type[BRAND] | Name } : { [BRAND]: Name })

export type Equals<T, U> = (<G>() => G extends T ? 1 : 0) extends <G>() => G extends U ? 1 : 0 ? true : false
export type NotEquals<T, U> = Equals<T, U> extends true ? false : true

true satisfies Equals<"a", "a">
false satisfies Equals<"a", string>
false satisfies Equals<string, string & { [BRAND]: "hello" }>
false satisfies Equals<string, number>
false satisfies Equals<string, string | number>
false satisfies Equals<string | number, string>
true satisfies Equals<string, string | "">
false satisfies Equals<true, boolean>
true satisfies Equals<true | false, true | false>

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
