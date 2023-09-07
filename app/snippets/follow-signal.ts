import { signal } from "../../lib/core"

// Create a signal with initial value
const foo = signal("foo")

// Follow the signal with the mode "immediate"
// This will log "foo" immediately after the follow
const follow = foo.follow((value) => console.log(value), { mode: "immediate" })

// Update the signal to "bar"
// This will log "bar"
foo.ref = "bar"

// Unfollow the signal
follow.unfollow()

// Update the signal to "baz"
// This will not log anything
foo.ref = "baz"
