import { fail, strictEqual } from "node:assert"
import { test } from "node:test"
import type { Signal } from "../core"
import { signal } from "../core"
import { INSTANCEOF, TYPEOF, match } from "./switch"

const describe = () => {
	const line = new Error().stack!.split("\n")[2]!.split(":").at(-2)!.replace(/\D/g, "")
	return `switch at line: ${line}`
}

test(describe(), () => {
	const signalValue = signal<string | null>("yo!")

	function toUpperCase(value: string) {
		return value.toUpperCase()
	}

	const result = match(signalValue)
		.case(null, () => "value is null")
		.default((value) => {
			strictEqual(typeof value.ref, "string", `value is not a string, but ${typeof value.ref}`)
			return toUpperCase(value.ref)
		})
	result satisfies Readonly<Signal<string>>
	strictEqual(result.ref, "YO!", `result.ref is not "YO!", but ${result.ref} and signal.ref is ${signalValue.ref}`)
})

test(describe(), () => {
	const value = "yo!" as string | null

	function toUpperCase(value: string) {
		return value.toUpperCase()
	}

	const result = match(value)
		.case(null, () => "value is null")
		.default((value) => {
			strictEqual(typeof value, "string", `value is not a string, but ${typeof value}`)
			return toUpperCase(value)
		})
	result satisfies string
	strictEqual(result, "YO!", `result.ref is not "YO!", but ${result} and signal.ref is ${value}`)
})

test(describe(), () => {
	type MyId = Utils.Brand<"MyId", string>
	function createMyId(id: string): MyId {
		return id as MyId
	}
	const signalValue = signal<MyId | null>(createMyId("yo!"))

	const result = match(signalValue)
		.case(null, (value) => {
			value.ref satisfies null
			strictEqual(value.ref, null, `value.ref is not null, but ${value.ref}`)
			return value.ref
		})
		.default((value) => {
			value.ref satisfies MyId
			strictEqual(value.ref, createMyId("yo!"), `value.ref is not "yo!", but ${value.ref}`)
			return value.ref
		})

	result satisfies Readonly<Signal<MyId | null>>

	signalValue.ref = null
	signalValue.ref = createMyId("yo!")
})

test(describe(), () => {
	type MyId = Utils.Brand<"MyId", string>
	function createMyId(id: string): MyId {
		return id as MyId
	}
	const value = createMyId("yo!") as MyId | null

	const result = match(value)
		.case(null, (value) => {
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
	type MyId = Utils.Brand<"MyId", string>
	function createMyId(id: string): MyId {
		return id as MyId
	}
	const signalValue = signal<MyId>(createMyId("yo!"))

	function acceptMyId(id: MyId) {
		return id
	}

	match(signalValue)
		.case(createMyId("another"), (value) => value.ref satisfies MyId)
		.default((value) => {
			value.ref satisfies MyId
			acceptMyId(value.ref)
		}) satisfies Readonly<Signal<MyId | void>>
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

	const signalValue = signal<Value>({ type: "foo", foo: "foo", common: "common" })

	const result = match(signalValue)
		.case({ type: "foo" }, (value) => {
			value.ref.foo satisfies string
			value.ref.common satisfies string
			return "foo" as const
		})
		.case({ type: "bar" }, (value) => {
			value.ref.bar satisfies string
			value.ref.common satisfies string
			return "bar" as const
		})
		.case({ type: "baz" }, (value) => {
			value.ref.baz satisfies string
			value.ref.common satisfies number
			return "baz" as const
		})
		.default()

	result satisfies Readonly<Signal<"foo" | "bar" | "baz">>

	strictEqual(result.ref, "foo", `result.ref is not "foo", but ${result.ref}`)
})

test(describe(), () => {
	const signalValue = signal("foo")

	let value = "foo" as string

	const result = match(signalValue)
		.case(value, (value) => "foo" as const)
		.default((value) => "other" as const)

	result satisfies Readonly<Signal<"foo" | "other">>
	strictEqual(result.ref, "foo", `result.ref is not "foo", but ${result.ref}`)
})

test(describe(), () => {
	const signalValue = signal<{ foo: string } | null | Error>({ foo: "foo" })
	const result = match(signalValue)
		.case(null, (value) => {
			value.ref satisfies null
			fail(`value.ref is null, but it should be { foo: "foo" }`)
			return "null" as const
		})
		.case({ [INSTANCEOF]: Error }, (value) => {
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

	result satisfies Readonly<Signal<"null" | "error" | { foo: string }>>
})

test(describe(), () => {
	const signalValue = signal<{ foo: string } | null | Error>(new Error())

	const result = match(signalValue)
		.case(null, (value) => {
			value.ref satisfies null
			return "null" as const
		})
		.case({ [INSTANCEOF]: Error }, (value) => {
			value.ref satisfies Error
			return "error" as const
		})
		.default((value) => {
			value.ref satisfies object
			true satisfies typeof value.ref extends Error ? false : true
			strictEqual(value.ref.foo, "foo", `result.ref is not "foo", but ${value.ref}`)
			return value.ref
		})

	result satisfies Readonly<Signal<"null" | "error" | { foo: string }>>
	strictEqual(result.ref, "error", `result.ref is not "error", but ${result.ref}`)
})

test(describe(), () => {
	const signalValue = signal<"foo" | null | Error>("foo")

	const result = match(signalValue)
		.case(null, (value) => {
			value.ref satisfies null
			return "null" as const
		})
		.case({ [TYPEOF]: "string" }, (value) => {
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
