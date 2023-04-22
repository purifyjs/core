import { createAwait } from "./logic/await"
import { createEach } from "./logic/each"
import { createMatch } from "./logic/match"
import { createSwitch } from "./logic/switch"
import { createDeferred } from "./signal/deferred"
import { createDerive } from "./signal/derive"
import { flattenSignal } from "./signal/flat"
import { createReadable } from "./signal/readable"
import { createWritable } from "./signal/writable"

export const $ = {
	writable: createWritable,
	readable: createReadable,
	derive: createDerive,
	deferred: createDeferred,
	flatten: flattenSignal,
	switch: createSwitch,
	match: createMatch,
	each: createEach,
	await: createAwait,
}
