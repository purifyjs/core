import { createWritable } from "./writable"
import { createReadable } from "./readable"
import { createDerive } from "./derive"
import { createMatch } from "./match"
import { createEach } from "./each"
import { createSuspense } from "./suspense"

export namespace $ {
	export const writable = createWritable
	export const readable = createReadable
	export const derive = createDerive
	export const match = createMatch
	export const each = createEach
	export const suspense = createSuspense
}
