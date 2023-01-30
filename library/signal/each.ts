import { Signal } from "./base"
import { createDerivedSignal } from "./derived"
import { createSignal, SignalSettable } from "./settable"

export function createEachSignal<T extends unknown[], R>(each: Signal<T> | T, as: (item: T[number], index: Signal<number>) => R, key?: (item: T[number]) => string | number)
{
    let caches: Record<string, { index: SignalSettable<number>, value: R }> = {}
    const derived = createDerivedSignal(($) => {
        const newCaches: typeof caches = {}
        const collection = each instanceof Signal ? $(each).value : each
        const results = collection.map((item, index) => {
            const k = key?.(item)
            if (k) 
            {
                const cache = caches[k]
                if (cache) 
                {
                    cache.index.value = index
                    newCaches[k] = cache
                    return cache.value
                }
                else 
                {
                    const indexSignal = createSignal(index)
                    const value = as(item, indexSignal)
                    newCaches[k] = { index: indexSignal, value }
                    return value
                }
            }

            return as(item, createSignal(index))
        })
        caches = newCaches
        return results
    })

    return derived
}