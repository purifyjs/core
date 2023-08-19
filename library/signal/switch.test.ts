import { strictEqual } from "node:assert"
import { test } from "node:test"
import { SignalReadable, createSignalWritable } from "."
import { Brand } from "../utils/type"
import { createSwitch } from "./switch"

test("", () => {
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

test("", () => {
	type MyId = Brand<"MyId", string>
	function createMyId(id: string): MyId {
		return id as MyId
	}
	const signal = createSignalWritable<MyId | null>(createMyId("yo!"))

	createSwitch(signal)
		.match(null, () => "value is null")
		.default((value) => {
			value.ref satisfies MyId
		})
})

test("", () => {
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
