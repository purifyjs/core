import { Signal } from "./base"
import { createDerivedSignal } from "./derived"

export function createEachSignal<T extends unknown[], R>(each: Signal<T> | T, as: (item: T[number], index: number) => R, key?: (item: T[number], index: number) => string | number)
{
    let caches: Record<string, R> = {}
    const derived = createDerivedSignal(($) => {
        const newCaches: typeof caches = {}
        const collection = each instanceof Signal ? $(each).value : each
        const results = collection.map((item, index) => {
            const k = key?.(item, index)
            if (k) 
            {
                const cache = caches[k]
                if (cache) return newCaches[k] = cache
                else return newCaches[k] = as(item, index)
            }

            return as(item, index)
        })
        caches = newCaches
        return results
    })

    return derived
}