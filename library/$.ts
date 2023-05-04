import { createAwait } from "./logic/await"
import { createEach } from "./logic/each"
import { createMatch } from "./logic/match"
import { createReadable, createWritable } from "./signal"
import { createDeferred } from "./signal/deferred"
import { createDerive } from "./signal/derive"
import { flattenSignal } from "./signal/flatten"

export const $ = {
	writable: createWritable,
	readable: createReadable,
	derive: createDerive,
	deferred: createDeferred,
	flatten: flattenSignal,
	match: createMatch,
	each: createEach,
	await: createAwait,
}
