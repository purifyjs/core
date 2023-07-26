import { onEvent$ } from "./lifecycle/events"
import { onMount$, onUnmount$ } from "./lifecycle/index"
import { createInterval$, createTimeout$ } from "./lifecycle/timers"
import { createAwait } from "./signal/await"
import { createSignalDeferred } from "./signal/defer"
import { createSignalDerive } from "./signal/derive"
import { createEach } from "./signal/each"
import { createEffect, createEffect$ } from "./signal/effect"
import { createSignalFlattened } from "./signal/flatten"
import { createSignalReadable, createSignalWritable } from "./signal/index"
import { createMatch } from "./signal/match"

export const $: {
	writable: typeof createSignalWritable
	readable: typeof createSignalReadable
	derive: typeof createSignalDerive
	defer: typeof createSignalDeferred
	flatten: typeof createSignalFlattened
	match: typeof createMatch
	each: typeof createEach
	await: typeof createAwait
	effect: typeof createEffect
	effect$: typeof createEffect$
	timeout$: typeof createTimeout$
	interval$: typeof createInterval$
	onMount$: typeof onMount$
	onUnmount$: typeof onUnmount$
	onEvent$: typeof onEvent$
} = {
	writable: createSignalWritable,
	readable: createSignalReadable,
	derive: createSignalDerive,
	defer: createSignalDeferred,
	flatten: createSignalFlattened,
	match: createMatch,
	each: createEach,
	await: createAwait,
	effect: createEffect,
	effect$: createEffect$,
	timeout$: createTimeout$,
	interval$: createInterval$,
	onMount$: onMount$,
	onUnmount$: onUnmount$,
	onEvent$: onEvent$,
}
