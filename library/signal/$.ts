import { createWritable } from "./writable"
import { createReadable } from "./readable"
import { createDerive } from "./derive"
import { createSwitch } from "./switch"
import { createEach } from "./each"
import { createAwait } from "./await"

/**
 * All the signal related functions are defined here.
 * @function writable Creates a writable signal.
 * @function readable Creates a readable signal.
 * @function derive Creates a derived signal.
 * @function switch Creates a switch signal.
 * @function each Creates an each signal.
 * @function await Creates an await signal.
 */
export const $ = {
	writable: createWritable,
	readable: createReadable,
	derive: createDerive,
	switch: createSwitch,
	each: createEach,
	await: createAwait,
}
