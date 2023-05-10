let counters: Record<string, bigint> = {}
export function uniqueId(prefix = "$-") {
	counters[prefix] ??= 0n
	return `${prefix}${(counters[prefix]++).toString(36)}`
}
