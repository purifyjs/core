import { createWritable } from "./writable"
import { createReadable } from "./readable"
import { createDerive } from "./derive"
import { createSwitch } from "./switch"
import { createEach } from "./each"
import { createAwait } from "./await"

export const $ = {
	writable: createWritable,
	readable: createReadable,
	derive: createDerive,
	switch: createSwitch,
	each: createEach,
	await: createAwait,
}
