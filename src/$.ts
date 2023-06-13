import { onMount, onUnmount } from "./lifecycle/index"
import { createInterval$, createTimeout$ } from "./lifecycle/timers"
import { createAwait } from "./logic/await"
import { createEach } from "./logic/each"
import { createMatch } from "./logic/match"
import { createSignalDeferred } from "./signal/deferred"
import { createSignalDerive } from "./signal/derive"
import { createEffect, createEffect$ } from "./signal/effect"
import { createSignalFlattened } from "./signal/flatten"
import { createSignalReadable, createSignalWritable } from "./signal/index"

export const $: {
	writable: typeof createSignalWritable
	readable: typeof createSignalReadable
	derive: typeof createSignalDerive
	deferred: typeof createSignalDeferred
	flatten: typeof createSignalFlattened
	match: typeof createMatch
	each: typeof createEach
	await: typeof createAwait
	effect: typeof createEffect
	effect$: typeof createEffect$
	timeout$: typeof createTimeout$
	interval$: typeof createInterval$
	onMount: typeof onMount
	onUnmount: typeof onUnmount
} = {
	writable: createSignalWritable,
	readable: createSignalReadable,
	derive: createSignalDerive,
	deferred: createSignalDeferred,
	flatten: createSignalFlattened,
	match: createMatch,
	each: createEach,
	await: createAwait,
	effect: createEffect,
	effect$: createEffect$,
	timeout$: createTimeout$,
	interval$: createInterval$,
	onMount: onMount,
	onUnmount: onUnmount,
}
