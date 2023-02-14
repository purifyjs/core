import { assert } from "./assert"
import type { Obj } from "./type"

export function importFunctionAsync<M extends Obj>(module: Promise<M>) {
	const proxy = new Proxy(
		{},
		{
			get(_, p) {
				assert<keyof M>(p)
				return async (...params: unknown[]) => await (await module)[p](...params)
			},
		}
	)

	return proxy as {
		[K in keyof M]: M[K] extends Function ? (...params: Parameters<M[K]>) => ReturnType<M[K]> extends Promise<any> ? M[K] : Promise<M[K]> : never
	}
}
