import { fail, strictEqual } from "node:assert"
import { test } from "node:test"
import { SignalReadable, createSignalWritable } from "."
import { Brand } from "../utils/type"
import { INSTANCEOF, TYPEOF, createSwitch } from "./switch"

const describe = () => {
	const line = new Error().stack!.split("\n")[2]!.split(":").at(-2)!.replace(/\D/g, "")
	return `switch at line: ${line}`
}

test(describe(), () => {
	const signal = createSignalWritable<string | null>("yo!")

	function toUpperCase(value: string) {
		return value.toUpperCase()
	}

	const result = createSwitch(signal)
		.match(null, () => "value is null")
		.default((value) => {
			strictEqual(typeof value.ref, "string", `value is not a string, but ${typeof value.ref}`)
			return toUpperCase(value.ref)
		})
	result satisfies SignalReadable<string>
	strictEqual(result.ref, "YO!", `result.ref is not "YO!", but ${result.ref} and signal.ref is ${signal.ref}`)
})

test(describe(), () => {
	const value = "yo!" as string | null

	function toUpperCase(value: string) {
		return value.toUpperCase()
	}

	const result = createSwitch(value)
		.match(null, () => "value is null")
		.default((value) => {
			strictEqual(typeof value, "string", `value is not a string, but ${typeof value}`)
			return toUpperCase(value)
		})
	result satisfies string
	strictEqual(result, "YO!", `result.ref is not "YO!", but ${result} and signal.ref is ${value}`)
})

test(describe(), () => {
	type MyId = Brand<"MyId", string>
	function createMyId(id: string): MyId {
		return id as MyId
	}
	const signal = createSignalWritable<MyId | null>(createMyId("yo!"))

	const result = createSwitch(signal)
		.match(null, (value) => {
			value.ref satisfies null
			strictEqual(value.ref, null, `value.ref is not null, but ${value.ref}`)
			return value.ref
		})
		.default((value) => {
			value.ref satisfies MyId
			strictEqual(value.ref, createMyId("yo!"), `value.ref is not "yo!", but ${value.ref}`)
			return value.ref
		})

	result satisfies SignalReadable<MyId | null>

	signal.ref = null
	signal.ref = createMyId("yo!")
})

test(describe(), () => {
	type MyId = Brand<"MyId", string>
	function createMyId(id: string): MyId {
		return id as MyId
	}
	const value = createMyId("yo!") as MyId | null

	const result = createSwitch(value)
		.match(null, (value) => {
			value satisfies null
			strictEqual(value, null, `value is not null, but ${value}`)
			return value
		})
		.default((value) => {
			value satisfies MyId
			strictEqual(value, createMyId("yo!"), `value is not "yo!", but ${value}`)
			return value
		})

	result satisfies MyId | null
})

test(describe(), () => {
	type MyId = Brand<"MyId", string>
	function createMyId(id: string): MyId {
		return id as MyId
	}
	const signal = createSignalWritable<MyId>(createMyId("yo!"))

	function acceptMyId(id: MyId) {
		return id
	}

	createSwitch(signal)
		.match(createMyId("another"), (value) => value.ref satisfies MyId)
		.default((value) => {
			value.ref satisfies MyId
			acceptMyId(value.ref)
		}) satisfies SignalReadable<MyId | void>
})

test(describe(), () => {
	type Foo = {
		type: "foo"
		foo: string
		common: string
	}
	type Bar = {
		type: "bar"
		bar: string
		common: string
	}
	type Baz = {
		type: "baz"
		baz: string
		common: number
	}
	type Value = Foo | Bar | Baz

	const signal = createSignalWritable<Value>({ type: "foo", foo: "foo", common: "common" })

	const result = createSwitch(signal)
		.match({ type: "foo" }, (value) => {
			value.ref.foo satisfies string
			value.ref.common satisfies string
			return "foo" as const
		})
		.match({ type: "bar" }, (value) => {
			value.ref.bar satisfies string
			value.ref.common satisfies string
			return "bar" as const
		})
		.match({ type: "baz" }, (value) => {
			value.ref.baz satisfies string
			value.ref.common satisfies number
			return "baz" as const
		})
		.default()

	result satisfies SignalReadable<"foo" | "bar" | "baz">

	strictEqual(result.ref, "foo", `result.ref is not "foo", but ${result.ref}`)
})

test(describe(), () => {
	const signal = createSignalWritable("foo")

	let value = "foo" as string

	const result = createSwitch(signal)
		.match(value, (value) => "foo" as const)
		.default((value) => "other" as const)

	result satisfies SignalReadable<"foo" | "other">
	strictEqual(result.ref, "foo", `result.ref is not "foo", but ${result.ref}`)
})

test(describe(), () => {
	const signal = createSignalWritable<{ foo: string } | null | Error>({ foo: "foo" })
	const result = createSwitch(signal)
		.match(null, (value) => {
			value.ref satisfies null
			fail(`value.ref is null, but it should be { foo: "foo" }`)
			return "null" as const
		})
		.match({ [INSTANCEOF]: Error }, (value) => {
			value.ref satisfies Error
			fail(`value.ref is an error, but it should be { foo: "foo" }`)
			return "error" as const
		})
		.default((value) => {
			value.ref satisfies object
			true satisfies typeof value.ref extends Error ? false : true
			strictEqual(value.ref.foo, "foo", `result.ref is not "foo", but ${value.ref}`)
			return value.ref
		})

	result satisfies SignalReadable<"null" | "error" | { foo: string }>
})

test(describe(), () => {
	const signal = createSignalWritable<{ foo: string } | null | Error>(new Error())

	const result = createSwitch(signal)
		.match(null, (value) => {
			value.ref satisfies null
			return "null" as const
		})
		.match({ [INSTANCEOF]: Error }, (value) => {
			value.ref satisfies Error
			return "error" as const
		})
		.default((value) => {
			value.ref satisfies object
			true satisfies typeof value.ref extends Error ? false : true
			strictEqual(value.ref.foo, "foo", `result.ref is not "foo", but ${value.ref}`)
			return value.ref
		})

	result satisfies SignalReadable<"null" | "error" | { foo: string }>
	strictEqual(result.ref, "error", `result.ref is not "error", but ${result.ref}`)
})

test(describe(), () => {
	const signal = createSignalWritable<"foo" | null | Error>("foo")

	const result = createSwitch(signal)
		.match(null, (value) => {
			value.ref satisfies null
			return "null" as const
		})
		.match({ [TYPEOF]: "string" }, (value) => {
			value.ref satisfies "foo"
			return value.ref
		})
		.default((value) => {
			value.ref satisfies Error
			return "error" as const
		})

	result.ref satisfies "null" | "error" | string
	strictEqual(result.ref, "foo", `result.ref is not "foo", but ${result.ref}`)
})

/* 
// TODO: Add array and tuple support 
test(describe(), () => {
	const signal = createSignalWritable([1, 2, 3, 4])
	const result = createSwitch(signal)
		.match([{ [TYPEOF]: "number" }, 2], (value) => {
			value.ref satisfies [number, 2]
			return "number 2" as const
		})
		.default((value) => "other" as const)

	result satisfies SignalReadable<"number 2" | "other">

	strictEqual(result.ref, "number 2", `result.ref is not "number 2", but ${result.ref}`)
}) */
