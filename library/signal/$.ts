import { createAwait } from "./await"
import { createDeferred } from "./deferred"
import { createDerive } from "./derive"
import { createEach } from "./each"
import { createMatch } from "./match"
import { createReadable } from "./readable"
import { createSwitch } from "./switch"
import { createWritable } from "./writable"

export const $ = {
	writable: createWritable,
	readable: createReadable,
	derive: createDerive,
	deferred: createDeferred,
	switch: createSwitch,
	match: createMatch,
	each: createEach,
	await: createAwait,
}
