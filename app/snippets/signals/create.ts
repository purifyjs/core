import type { Signal } from "@/../lib/core"
import { signal } from "@/../lib/core"

// Create a signal with the initial value "foo"
const foo: Signal<string> = signal("foo")

// Mutate the signal
foo.ref += "-bar"

console.log(foo.ref) // foo-bar
