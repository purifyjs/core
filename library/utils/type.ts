export type ObjUnknown = Record<PropertyKey, unknown>
export type Obj = Record<PropertyKey, any>
export type Excludable<T, Then, Else> = T extends number
	? number extends T
		? Else
		: T extends object
		? Else
		: Then
	: T extends string
	? string extends T
		? Else
		: T extends object
		? Else
		: Then
	: T extends symbol
	? symbol extends T
		? Else
		: T extends object
		? Else
		: Then
	: T extends boolean
	? boolean extends T
		? Else
		: T extends object
		? Else
		: Then
	: T extends Function
	? Function extends T
		? Else
		: Then
	: T extends null
	? Then
	: T extends undefined
	? Then
	: Else
