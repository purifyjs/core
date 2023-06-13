let counter: bigint = 0n
export function uniqueId() {
	return (counter++).toString(36).padStart(6, "0")
}
