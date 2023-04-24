/**
 * @internal
 */
export function randomId() {
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36)
}
