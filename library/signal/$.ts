import { createWritable } from "./writable"
import { createReadable } from "./readable"
import { createDerive } from "./derive"
import { createMatch } from "./match"
import { createEach } from "./each"
import { createAwait } from "./await"

export namespace $ {
	export const Writable = createWritable
	export const Readable = createReadable
	export const Derive = createDerive
	export const Match = createMatch
	export const Each = createEach
	export const Await = createAwait
}
