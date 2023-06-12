import { assert } from "./assert.js"
import type { ObjUnknown } from "./type.js"

export function lazyImport<M extends ObjUnknown>(module: Promise<M>) {
	const proxy = new Proxy(
		{},
		{
			get(_, key) {
				assert<keyof M>(key)
				return async (...params: unknown[]) => {
					const value = (await module)[key]
					return typeof value === "function" ? await value(...params) : value
				}
			},
		}
	)

	return proxy as {
		[K in keyof M]: M[K] extends (...args: any) => any
			? (...params: Parameters<M[K]>) => ReturnType<M[K]> extends Promise<any> ? ReturnType<M[K]> : Promise<ReturnType<M[K]>>
			: () => M[K] extends Promise<any> ? M[K] : Promise<M[K]>
	}
}
