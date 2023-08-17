import { defineComponent } from "./component/index"
import { onEvent$ } from "./lifecycle/events"
import { onMount$, onUnmount$ } from "./lifecycle/index"
import { createInterval$, createTimeout$ } from "./lifecycle/timers"
import { createSignalAwait } from "./signal/await"
import { createSignalDeferred } from "./signal/defer"
import { createSignalDerived } from "./signal/derive"
import { createSignalEach } from "./signal/each"
import { createEffect, createEffect$ } from "./signal/effect"
import { createSignalFlattened } from "./signal/flatten"
import { createSignalReadable, createSignalWritable } from "./signal/index"
import { createSwitch } from "./signal/match"

export const $: {
	component: typeof defineComponent
	writable: typeof createSignalWritable
	readable: typeof createSignalReadable
	derive: typeof createSignalDerived
	defer: typeof createSignalDeferred
	flatten: typeof createSignalFlattened
	switch: typeof createSwitch
	each: typeof createSignalEach
	await: typeof createSignalAwait
	effect: typeof createEffect
	effect$: typeof createEffect$
	timeout$: typeof createTimeout$
	interval$: typeof createInterval$
	onMount$: typeof onMount$
	onUnmount$: typeof onUnmount$
	onEvent$: typeof onEvent$
} = {
	component: defineComponent,
	writable: createSignalWritable,
	readable: createSignalReadable,
	derive: createSignalDerived,
	defer: createSignalDeferred,
	flatten: createSignalFlattened,
	switch: createSwitch,
	each: createSignalEach,
	await: createSignalAwait,
	effect: createEffect,
	effect$: createEffect$,
	timeout$: createTimeout$,
	interval$: createInterval$,
	onMount$: onMount$,
	onUnmount$: onUnmount$,
	onEvent$: onEvent$,
}
