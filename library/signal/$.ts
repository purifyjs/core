import { createAwait } from "./await"
import { createDerive } from "./derive"
import { createEach } from "./each"
import { createReadable } from "./readable"
import { createSwitch } from "./switch"
import { createWritable } from "./writable"

export const $ = {
	writable: createWritable,
	readable: createReadable,
	derive: createDerive,
	switch: createSwitch,
	each: createEach,
	await: createAwait,
}
