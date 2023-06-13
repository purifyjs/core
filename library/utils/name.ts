/**
 * @internal
 */
export function nameOf(of: any) {
	return `${of.name ?? of!.constructor.name ?? `${of}`}`
}

/**
 * @internal
 */
export function typeOf(of: any) {
	return `(${typeof of} ${nameOf(of)} ${of})`
}
