export function randomId() {
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36)
}

export function compileTimeId(): string {
	throw new Error("This code should be compiled away.")
}