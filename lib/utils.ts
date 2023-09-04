namespace Utils {
	export type Kebab<T extends string, A extends string = ""> = T extends `${infer F}${infer R}`
		? Kebab<R, `${A}${F extends Lowercase<F> ? "" : "-"}${Lowercase<F>}`>
		: A

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
}
