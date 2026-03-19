/// <reference lib="deno.ns" />

import { assertStrictEquals } from "jsr:@std/assert";
import { combine, ref, Sync, sync } from "./signals.ts";

function _(_fn: () => void) {}

_(() => {
	const signalSignal = sync<number>(() => {});
	const stateSignal = ref<number>(0);
	const derivedSignal = stateSignal.derive((n) => n * 2);

	/// @ts-expect-error read-only
	signalSignal.val = 0;
	stateSignal.val = 0;
	/// @ts-expect-error read-only
	derivedSignal.val = 0;

	function acceptSignal(_: Sync<unknown>) {}
	function acceptref(_: Sync.Ref<unknown>) {}

	acceptSignal(signalSignal);
	acceptSignal(stateSignal);
	acceptSignal(derivedSignal);

	/// @ts-expect-error read-only
	acceptref(signalSignal);
	acceptref(stateSignal);
	/// @ts-expect-error read-only
	acceptref(derivedSignal);
});

Deno.test("Derive counter with immediate basics", () => {
	const value = ref(0);
	const double = value.derive((v) => v * 2);

	const results: number[] = [];
	double.follow((value) => results.push(value), true);

	for (let i = 0; i < 8; i++) {
		value.val++;
	}

	assertStrictEquals(results.length, 9);
	assertStrictEquals(results[0], 0);
	assertStrictEquals(results[8], 16);
});

Deno.test("Derive counter without immediate basics", () => {
	const value = ref(0);
	const double = value.derive((v) => v * 2);

	const results: number[] = [];
	double.follow((value) => results.push(value));

	for (let i = 0; i < 8; i++) {
		value.val++;
	}

	assertStrictEquals(results.length, 8);
	assertStrictEquals(results[0], 2);
	assertStrictEquals(results[7], 16);
});

Deno.test("Combine multiple signals", () => {
	const a = ref(0);
	const b = ref(0);
	const ab = combine({ a, b }).derive(({ a, b }) => `${a},${b}`);

	const results: string[] = [];
	ab.follow((ab) => results.push(ab));

	for (let i = 0; i < 3; i++) {
		b.val++;
		a.val++;
	}

	assertStrictEquals(results.length, 6);
	assertStrictEquals(results[0], "0,1");
	assertStrictEquals(results[5], "3,3");
});

Deno.test("Derived signal multi follower should call getter once", () => {
	let counter = 0;
	const a = ref(0);
	const b = a.derive((value) => {
		counter++;
		return value;
	});
	b.follow(() => {});
	b.follow(() => {});
	b.follow(() => {});
	b.follow(() => {});

	a.val++;

	assertStrictEquals(counter, 1 + 1); // +1 for the initial computation
});

Deno.test("Derived signal shouldn't call followers if the value is the same as the previous value", () => {
	const a = ref(0);
	const b = a.derive((val) => val % 2);
	const results: unknown[] = [];
	b.follow((value) => {
		results.push(value);
	});

	a.val = 1;
	a.val = 3;
	a.val = 2;

	assertStrictEquals(results.length, 2);
	assertStrictEquals(results[0], 1);
	assertStrictEquals(results[1], 0);
});

Deno.test("Derived signal should update as many times as the source changes", () => {
	let counter = 0;
	const a = ref(0);
	const b = a.derive((value) => {
		counter++;
		return value;
	});
	b.follow(() => {});
	b.follow(() => {});

	a.val++;
	a.val++;

	assertStrictEquals(counter, 2 + 1); // +1 for the initial computation
});

Deno.test("Derived signal shouldn't run without followers", () => {
	let counter = 0;
	const a = ref(0);
	a.derive((value) => {
		counter++;
		return value;
	});

	a.val++;

	assertStrictEquals(counter, 0);
});

Deno.test("Derived signal shouldn't compute without followers", () => {
	let counter = 0;
	const a = ref(0);
	a.derive((value) => {
		counter++;
		return value;
	});

	assertStrictEquals(counter, 0);
});

Deno.test("State, no infinite follower emit", () => {
	const a = ref(0);
	let counter = 0;
	function follower() {
		// Prevent infinite loop
		if (counter > 8) return;

		a.follow(() => {
			counter++;
			follower();
		});
	}
	follower();

	a.val++;

	assertStrictEquals(counter, 1);
});

Deno.test("Deep derivation shouldn't run multiple times", () => {
	const a = ref(0);
	let counter = 0;

	a.derive((value) => {
		counter++;
		return value;
	})
		.derive((value) => value)
		.derive((value) => value)
		.derive((value) => value)
		.derive((value) => value)
		.follow(() => {});

	assertStrictEquals(counter, 1);
});

Deno.test("State should start on get, if there are no followers", () => {
	const a = ref("abc");

	const b = a
		.derive((value) => value)
		.derive((value) => value)
		.derive((value) => value)
		.derive((value) => value);

	assertStrictEquals(b.val, "abc");
});

Deno.test("Combine should work with object of different types", () => {
	const num = ref(42);
	const str = ref("hello");
	const bool = ref(true);

	const combined = combine({ num, str, bool });
	const results: { num: number; str: string; bool: boolean }[] = [];

	combined.follow((vals) => results.push(vals), true);

	num.val = 100;
	str.val = "world";
	bool.val = false;

	assertStrictEquals(results.length, 4);
	assertStrictEquals(results[0]!.num, 42);
	assertStrictEquals(results[0]!.str, "hello");
	assertStrictEquals(results[0]!.bool, true);
	assertStrictEquals(results[3]!.num, 100);
	assertStrictEquals(results[3]!.str, "world");
	assertStrictEquals(results[3]!.bool, false);
});

Deno.test("Combine derived chain", () => {
	const a = ref(1);
	const b = ref(2);
	const sum = combine({ a, b }).derive(({ a, b }) => a + b);

	const results: number[] = [];
	sum.follow((val) => results.push(val), true);

	a.val = 10;
	b.val = 20;

	assertStrictEquals(results.length, 3);
	assertStrictEquals(results[0], 3);
	assertStrictEquals(results[1], 12);
	assertStrictEquals(results[2], 30);
});

Deno.test("Infinite loop test", () => {
	let counter = 0;
	const a = new Sync(() => {
		counter++;
		if (counter > 100) return;
		a.val;
	});
	a.val;

	assertStrictEquals(counter, 1);
});

Deno.test("No stop leak", () => {
	let counter = 0;
	// deno-lint-ignore prefer-const
	let unfollow: Sync.Unfollower;
	const a = new Sync(() => {
		if (typeof unfollow !== "undefined") {
			unfollow();
		}

		return () => {
			counter++;
		};
	});
	unfollow = a.follow(() => {});
	unfollow();
	assertStrictEquals(counter, 1);
});
