import { defineComponent } from "./component"
import { onMount$, onUnmount$ } from "./lifecycle"
import { onEvent$ } from "./lifecycle/events"
import { createInterval$, createTimeout$ } from "./lifecycle/timers"
import { createSignalReadable, createSignalWritable } from "./signal"
import { createSignalAwait } from "./signal/await"
import { createSignalDeferred } from "./signal/defer"
import { createSignalDerived } from "./signal/derive"
import { createEach } from "./signal/each"
import { createEffect, createEffect$ } from "./signal/effect"
import { createSignalFlattened } from "./signal/flatten"
import { createSwitch } from "./signal/switch"

export const $: {
	component: typeof defineComponent
	writable: typeof createSignalWritable
	readable: typeof createSignalReadable
	derive: typeof createSignalDerived
	defer: typeof createSignalDeferred
	flatten: typeof createSignalFlattened
	switch: typeof createSwitch
	each: typeof createEach
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
	each: createEach,
	await: createSignalAwait,
	effect: createEffect,
	effect$: createEffect$,
	timeout$: createTimeout$,
	interval$: createInterval$,
	onMount$: onMount$,
	onUnmount$: onUnmount$,
	onEvent$: onEvent$,
}
