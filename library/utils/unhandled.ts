// Let's you give both runtime and typescript error when you don't handle/match all of the switch cases
// Can be used in other places where you narrow the types too, not just switch cases
export type IsHandled<T> = [T] extends [never] ? true : false
export function unhandled<T, M extends string>(_message: M, _: IsHandled<T> extends true ? T : M) {
	throw new Error(_message)
}
