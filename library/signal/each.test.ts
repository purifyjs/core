import { strictEqual } from "node:assert"
import { test } from "node:test"
import { createSignalWritable } from "."
import { createEach } from "./each"

test(() => {
	const arr = createSignalWritable([1, 2, 3, 4, 5])

	const each = createEach(arr).as((item) => item.ref.toString())

	each.ref satisfies string[]

	strictEqual(each.ref.length, 5)
	strictEqual(each.ref[0], "1")
	strictEqual(each.ref[1], "2")
	strictEqual(each.ref[2], "3")
	strictEqual(each.ref[3], "4")
	strictEqual(each.ref[4], "5")

	arr.ref.push(6)
	arr.signal()

	strictEqual(each.ref.length, 6)
	strictEqual(each.ref[5], "6")
})
