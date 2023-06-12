import { onMount, onUnmount } from "./lifecycle.js"
import { createInterval$, createTimeout$ } from "./lifecycle/timers.js"
import { createAwait } from "./logic/await.js"
import { createEach } from "./logic/each.js"
import { createMatch } from "./logic/match.js"
import { createSignalReadable, createSignalWritable } from "./signal.js"
import { createSignalDeferred } from "./signal/deferred.js"
import { createSignalDerive } from "./signal/derive.js"
import { createEffect, createEffect$ } from "./signal/effect.js"
import { createSignalFlattened } from "./signal/flatten.js"

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
