declare const ERROR: unique symbol
export type ErrorType<Message extends string> = { [ERROR]: Message }

export type IsReadonly<T> = T extends { readonly [K in keyof T]: T[K] } ? true : false

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
