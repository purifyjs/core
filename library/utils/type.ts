declare const ERROR: unique symbol
type ERROR = typeof ERROR
export type ErrorType<Message extends string> = { [ERROR]: Message }

declare const BRAND: unique symbol
type BRAND = typeof BRAND
export type Brand<Name extends string, Type> = Type & (Type extends { [BRAND]: string } ? { [BRAND]: Type[BRAND] | Name } : { [BRAND]: Name })

export type IsReadonly<T> = T extends { readonly [K in keyof T]: T[K] } ? true : false

export type Prettify<T> = T extends object ? { [K in keyof T]: T[K] } & {} : T
export type DeepOptional<T> = T extends object ? { [K in keyof T]?: DeepOptional<T[K]> } : T

export type IsConst<T> = T extends string
	? string extends T
		? false
		: true
	: T extends number
	? number extends T
		? false
		: true
	: T extends bigint
	? bigint extends T
		? false
		: true
	: T extends boolean
	? boolean extends T
		? false
		: true
	: T extends symbol
	? symbol extends T
		? false
		: true
	: T extends undefined
	? undefined extends T
		? false
		: true
	: T extends null
	? null extends T
		? false
		: true
	: T extends object
	? { [K in keyof T]: IsConst<T[K]> }[keyof T] extends true
		? true
		: false
	: false
