import { SignalReadable } from "./readable"
import { createDerive } from "./derivable"
import { createWritable, SignalWritable } from "./writable"

export function createEach<T extends unknown[], R>(each: SignalReadable<T> | T, as: (item: T[number], index: SignalReadable<number>) => R, key?: (item: T[number]) => string | number)
{
    let caches: Record<string, { index: SignalWritable<number>, value: R }> = {}
    const derived = createDerive(($) => {
        const newCaches: typeof caches = {}
        const collection = each instanceof SignalReadable ? $(each).value : each
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
                    const indexSignal = createWritable(index)
                    const value = as(item, indexSignal)
                    newCaches[k] = { index: indexSignal, value }
                    return value
                }
            }

            return as(item, createWritable(index))
        })
        caches = newCaches
        return results
    })

    return derived
}