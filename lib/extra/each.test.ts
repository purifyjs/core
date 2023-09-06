import { strictEqual } from "node:assert"
import { test } from "node:test"
import { signal } from "../core"
import { each } from "./each"

const describe = () => {
	const line = new Error().stack!.split("\n")[2]!.split(":").at(-2)!.replace(/\D/g, "")
	return `each at line: ${line}`
}

test(describe(), () => {
	const arr = signal([1, 2, 3, 4, 5])

	const result = each(arr)
		.key((item) => item)
		.as((item) => item.ref.toString())

	result.ref satisfies string[]

	strictEqual(result.ref.length, 5)
	strictEqual(result.ref[0], "1")
	strictEqual(result.ref[1], "2")
	strictEqual(result.ref[2], "3")
	strictEqual(result.ref[3], "4")
	strictEqual(result.ref[4], "5")

	arr.ref.push(6)
	arr.ping()

	strictEqual(result.ref.length, 6)
	strictEqual(result.ref[5], "6")
})
