import { derive } from "@/../lib/core"

export namespace IPFS {
	export const isIpfs = location.hostname.endsWith("ipfs.localhost") || location.hostname.endsWith("ipns.localhost")

	export function resolve(hash: string) {
		return derive(() => (isIpfs ? `ipfs://${hash}` : `https://ipfs.io/ipfs/${hash}`))
	}
}
